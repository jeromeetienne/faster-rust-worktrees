import Fs from 'node:fs';
import Path from 'node:path';
import { Configuration } from '../repository/configuration.js';
import type { RepositoryConfiguration } from '../repository/configuration.js';
import { ProcessCommand } from '../repository/process_command.js';
import { WorktreeGit } from '../repository/worktree_git.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	TargetCleanup — previews stale and obsolete Cargo output conservatively
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** A candidate kept bound to its owning checkout and configured target folder. */
export type CleanupEntry = {
	/** Checkout that owns the output. */
	checkout: string;
	/** Relative target directory. */
	target: string;
	/** Absolute path proposed for removal. */
	path: string;
};

/** Plans cleanup without following links or removing uncertain Cargo output. */
export class TargetCleanup {
	/**
	 * Finds old target folders in registered secondary worktrees, never the main checkout.
	 * @param root Main checkout root.
	 * @param configuration Receiving repository settings.
	 * @param days Minimum age in days since any output entry changed.
	 * @returns Candidate output folders, without deleting anything.
	 */
	static stale(root: string, configuration: RepositoryConfiguration, days: number): CleanupEntry[] {
		if (Number.isFinite(days) === false || days < 1) {
			throw new Error('Age must be at least one day.');
		}
		const entries: CleanupEntry[] = [];
		const cutoff = Date.now() - days * 86400000;
		for (const checkout of WorktreeGit.listCheckoutPaths(root).slice(1)) {
			if (Fs.existsSync(checkout) === false) {
				continue;
			}
			for (const relative of configuration.targetDirectories) {
				const target = Configuration.target(checkout, relative);
				if (Fs.existsSync(target) === true && TargetCleanup._isCargoOutput(target) === true
					&& TargetCleanup._newest(target) < cutoff) {
					entries.push({
						checkout,
						target: relative,
						path: target,
					});
				}
			}
		}
		return entries;
	}

	/**
	 * Runs every configured Cargo command and retains all hashes reported by each command.
	 * @param checkout Checkout to inspect.
	 * @param configuration Receiving repository settings.
	 * @returns Obsolete hashed entries only; unrecognized output and incremental caches are retained.
	 */
	static obsolete(checkout: string, configuration: RepositoryConfiguration): CleanupEntry[] {
		const used = new Set<string>();
		for (const command of configuration.cargoCommands) {
			if (command.argv[0] !== 'cargo') {
				throw new Error('Cleanup needs direct Cargo commands to recognize fingerprint output.');
			}
			const output = ProcessCommand.run(checkout, command.cwd, command.argv, {
				CARGO_LOG: 'cargo::core::compiler::fingerprint=debug',
				CARGO_TERM_COLOR: 'never',
			});
			const matches = [...output.matchAll(/\.fingerprint[/\\][^/\\\s]+-([0-9a-f]{16})[/\\]/g)];
			if (matches.length === 0) {
				throw new Error('Unrecognized Cargo output for a configured command; no output may be removed.');
			}
			for (const match of matches) {
				used.add(match[1]);
			}
		}
		const entries: CleanupEntry[] = [];
		for (const relative of configuration.targetDirectories) {
			const target = Configuration.target(checkout, relative);
			if (Fs.existsSync(target) === false || TargetCleanup._isCargoOutput(target) === false) {
				continue;
			}
			TargetCleanup._collect(target, target, checkout, relative, used, entries);
		}
		return entries;
	}

	/**
	 * Removes validated entries. Call only with a newly computed plan and no concurrent builds.
	 * @param entries Newly computed cleanup plan.
	 * @returns Nothing.
	 */
	static remove(entries: CleanupEntry[]): void {
		const entriesByCheckout = new Map<string, CleanupEntry[]>();
		for (const entry of entries) {
			const checkoutEntries = entriesByCheckout.get(entry.checkout);
			if (checkoutEntries === undefined) {
				entriesByCheckout.set(entry.checkout, [entry]);
			} else {
				checkoutEntries.push(entry);
			}
		}
		for (const [checkout, checkoutEntries] of entriesByCheckout) {
			const targets = Configuration.targets(checkout, new Set(checkoutEntries.map((entry) => entry.target)));
			for (const target of targets.values()) {
				if (TargetCleanup._isCargoOutput(target) === false) {
					throw new Error('Cargo output marker missing; nothing may be removed.');
				}
			}
			for (const entry of checkoutEntries) {
				const target = targets.get(entry.target);
				const path = Configuration.path(checkout, Path.relative(checkout, entry.path));
				if (path !== entry.path || target === undefined || (path !== target
					&& path.startsWith(`${target}${Path.sep}`) === false)) {
					throw new Error('Cleanup entry escaped its target folder.');
				}
				TargetCleanup._newest(entry.path);
			}
		}
		for (const entry of entries) {
			Fs.rmSync(entry.path, {
				recursive: true,
			});
		}
	}

	/**
	 * Checks a real Cargo target marker.
	 * @param target Build output directory.
	 * @returns Whether a regular rustc marker exists.
	 */
	private static _isCargoOutput(target: string): boolean {
		return Fs.lstatSync(Path.join(target, '.rustc_info.json'), {
			throwIfNoEntry: false,
		})?.isFile() === true;
	}

	/**
	 * Checks all descendants and computes last output activity without following links.
	 * @param path Entry to inspect.
	 * @returns Latest modification or access time.
	 */
	private static _newest(path: string): number {
		const stat = Fs.lstatSync(path);
		if (stat.isSymbolicLink() === true) {
			throw new Error(`Retaining output containing a symbolic link: ${path}`);
		}
		let newest = stat.isDirectory() === true ? stat.mtimeMs : Math.max(stat.mtimeMs, stat.atimeMs);
		if (stat.isDirectory() === true) {
			for (const name of Fs.readdirSync(path)) {
				newest = Math.max(newest, TargetCleanup._newest(Path.join(path, name)));
			}
		}
		return newest;
	}

	/**
	 * Inspects recognized profile folders, keeping unknown names and symbolic links.
	 * @param directory Current directory.
	 * @param target Target root.
	 * @param checkout Owning checkout.
	 * @param relative Configured target relative path.
	 * @param used Live compilation hashes.
	 * @param entries Candidate entries accumulated by the traversal.
	 * @returns Nothing.
	 */
	private static _collect(directory: string, target: string, checkout: string, relative: string,
		used: Set<string>, entries: CleanupEntry[]): void {
		for (const entry of Fs.readdirSync(directory, {
			withFileTypes: true,
		})) {
			if (entry.isDirectory() === false) {
				continue;
			}
			const path = Path.join(directory, entry.name);
			if (['deps', '.fingerprint', 'build'].includes(entry.name) === true) {
				for (const name of Fs.readdirSync(path)) {
					const hash = /-([0-9a-f]{16})(?:\.[^/]*)?$/.exec(name)?.[1];
					if (hash !== undefined && used.has(hash) === false) {
						const candidate = Path.join(path, name);
						TargetCleanup._newest(candidate);
						entries.push({
							checkout,
							target: relative,
							path: candidate,
						});
					}
				}
			} else if (directory === target || Path.dirname(directory) === target) {
				TargetCleanup._collect(path, target, checkout, relative, used, entries);
			}
		}
	}
}

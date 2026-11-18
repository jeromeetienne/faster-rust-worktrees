import Fs from 'node:fs';
import Path from 'node:path';
import { z } from 'zod';
import { Configuration } from '../repository/configuration.js';
import type { RepositoryConfiguration } from '../repository/configuration.js';
import { DirectoryClone } from '../cargo_reuse/directory_clone.js';
import { SourceDates } from '../cargo_reuse/source_dates.js';
import { WorktreeGit } from '../repository/worktree_git.js';
import { BuildScriptOutputs } from '../cargo_reuse/build_script_outputs.js';
import { ProcessCommand } from '../repository/process_command.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	WorktreeCreate — creates independent worktrees with optional Cargo output reuse
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Cargo fields needed to identify local packages outside the workspace root. */
const cargoMetadataSchema = z.object({
	workspace_root: z.string(),
	packages: z.array(z.object({
		name: z.string(),
		manifest_path: z.string(),
		source: z.string().nullable(),
	})),
});

/** Configurable extraction of Heidrun Code's worktree creation mechanism. */
export class WorktreeCreate {
	/**
	 * Creates a worktree, initializes submodules, optionally clones output, then installs dependencies.
	 * @param root Main checkout root.
	 * @param name New branch name.
	 * @param configuration Receiving-repository settings.
	 * @param isWithoutOptimization Whether to create an ordinary worktree.
	 * @param baseRef Optional base reference override.
	 * @returns Worktree path, clone decisions, Cargo reuse warnings, and relocated record count.
	 */
	static run(root: string, name: string, configuration: RepositoryConfiguration,
		isWithoutOptimization = false, baseRef = configuration.baseRef) {
		if (name.startsWith('-') === true || WorktreeGit.isBranchNameValid(root, name) === false) {
			throw new Error(`Invalid branch name: ${name}`);
		}
		const worktreePath = Configuration.path(root, Path.join(configuration.worktreeDirectory, name));
		try {
			ProcessCommand.run(root, '.', ['git', 'check-ignore', '--quiet', worktreePath]);
		} catch {
			throw new Error(`Ignore ${configuration.worktreeDirectory}/ in Git before creating nested worktrees.`);
		}
		const targets = configuration.targetDirectories.map((relative) => Configuration.target(root, relative));
		WorktreeGit.addWorktree(root, worktreePath, name, baseRef);
		WorktreeGit.initializeSubmodules(worktreePath);
		const decisions: string[] = [];
		let rewrittenRecords = 0;
		let clonedCount = 0;
		for (const [index, relative] of configuration.targetDirectories.entries()) {
			if (isWithoutOptimization === true) {
				decisions.push(`${relative}: --without-optimization`);
				continue;
			}
			const source = targets[index];
			const destination = Configuration.target(worktreePath, relative);
			if (Fs.existsSync(destination) === true) {
				throw new Error(`Destination build output already exists: ${destination}`);
			}
			if (Fs.existsSync(source) === false) {
				decisions.push(`${relative}: missing build output; build the main checkout first`);
				continue;
			}
			Fs.mkdirSync(Path.dirname(destination), {
				recursive: true,
			});
			const error = DirectoryClone.clone(source, destination);
			if (error !== null) {
				Fs.rmSync(destination, {
					recursive: true,
					force: true,
				});
				decisions.push(`${relative}: copy-on-write unavailable: ${error}`);
				continue;
			}
			clonedCount += 1;
			decisions.push(`${relative}: copy-on-write cloned`);
			rewrittenRecords += BuildScriptOutputs.rewrite(root, worktreePath, destination);
		}
		if (clonedCount > 0) {
			SourceDates.copyFromMainCheckout(root, worktreePath);
		}
		if (configuration.installCommand !== undefined) {
			try {
				ProcessCommand.run(worktreePath, configuration.installCommand.cwd, configuration.installCommand.argv);
			} catch (error) {
				throw new Error(`Worktree retained at ${worktreePath}; installation failed: ${String(error)}`);
			}
		}
		const warnings = clonedCount > 0 ? WorktreeCreate._cargoWarnings(worktreePath, configuration) : [];
		return {
			worktreePath,
			decisions,
			rewrittenRecords,
			warnings,
		};
	}

	/**
	 * Checks the configured Cargo projects without fetching dependencies or changing lockfiles.
	 * @param worktreePath New worktree checkout.
	 * @param configuration Receiving-repository settings.
	 * @returns Cargo reuse warnings, separate from the file clone decisions.
	 */
	private static _cargoWarnings(worktreePath: string, configuration: RepositoryConfiguration): string[] {
		const warnings = new Set<string>();
		const inspected = new Set<string>();
		for (const { cwd, argv } of configuration.cargoCommands) {
			if (Path.basename(argv[0]) !== 'cargo') {
				continue;
			}
			const command = [argv[0], 'metadata', '--format-version', '1', '--frozen', '--quiet'];
			for (const [index, argument] of argv.entries()) {
				if (argument === '--manifest-path' || argument === '--features' || argument === '-F'
					|| argument === '--config') {
					const value = argv[index + 1];
					if (value !== undefined) {
						command.push(argument, value);
					}
				} else if (argument === '--all-features' || argument === '--no-default-features'
					|| /^--(manifest-path|features|config)=/.test(argument) || /^-F.+/.test(argument)) {
					command.push(argument);
				}
			}
			if (argv[1]?.startsWith('+') === true) {
				command.splice(1, 0, argv[1]);
			}
			const key = JSON.stringify([cwd, command]);
			if (inspected.has(key) === true) {
				continue;
			}
			inspected.add(key);
			try {
				const output = ProcessCommand.run(worktreePath, cwd, command);
				const metadata = cargoMetadataSchema.parse(JSON.parse(output));
				for (const localPackage of metadata.packages) {
					const relative = Path.relative(metadata.workspace_root, localPackage.manifest_path);
					if (localPackage.source === null && (relative.startsWith(`..${Path.sep}`) || Path.isAbsolute(relative))) {
						const manifest = Path.relative(worktreePath, localPackage.manifest_path);
						const workspace = Path.relative(worktreePath, metadata.workspace_root) || '.';
						warnings.add(`${localPackage.name} (${manifest}) is outside Cargo workspace ${workspace}. `
							+ 'Cargo can rebuild cloned output. Use a shared Cargo workspace for build reuse.');
					}
				}
			} catch {
				warnings.add(`Could not inspect Cargo dependencies from ${cwd} using frozen Cargo metadata. `
					+ 'Check the first build to confirm reuse.');
			}
		}
		return [...warnings];
	}
}

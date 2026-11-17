import Fs from 'node:fs';
import Path from 'node:path';
import { z } from 'zod';
import { WorktreeGit } from './worktree_git.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Configuration — validates receiving-repository settings
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Runtime configuration schema; commands are argument arrays, never shell text. */
export const configurationSchema = z.object({
	baseRef: z.string().min(1).default('HEAD'),
	worktreeDirectory: z.string().min(1).default('.agents/worktree'),
	targetDirectories: z.array(z.string().min(1)).min(1).default(['target']),
	installCommand: z.object({
		cwd: z.string(),
		argv: z.array(z.string()).min(1),
	}).optional(),
	cargoCommands: z.array(z.object({
		cwd: z.string(),
		argv: z.array(z.string()).min(1),
	})).min(1),
}).strict();

/** Validated configuration inferred from the runtime schema. */
export type RepositoryConfiguration = z.infer<typeof configurationSchema>;

/** Loads configuration and enforces paths that stay inside each checkout. */
export class Configuration {
	/**
	 * Reads a receiving repository's configuration.
	 * @param root Checkout root.
	 * @param file Relative configuration filename.
	 * @returns Validated repository settings.
	 */
	static read(root: string, file = 'faster_rust_worktrees.json'): RepositoryConfiguration {
		if (process.env.CARGO_TARGET_DIR !== undefined) {
			throw new Error('Unset CARGO_TARGET_DIR; configure checkout-local targetDirectories instead.');
		}
		const configuration = configurationSchema.parse(JSON.parse(Fs.readFileSync(Path.resolve(root, file), 'utf8')));
		Configuration.path(root, configuration.worktreeDirectory);
		for (const directory of configuration.targetDirectories) {
			Configuration.path(root, directory);
			if (configuration.worktreeDirectory === directory
				|| configuration.worktreeDirectory.startsWith(`${directory}/`)
				|| directory.startsWith(`${configuration.worktreeDirectory}/`)) {
				throw new Error('Build output and worktree directories must not overlap.');
			}
		}
		return configuration;
	}

	/**
	 * Resolves a path without allowing escape or symbolic-link ancestors.
	 * @param root Checkout root.
	 * @param relative Relative path.
	 * @param isRootAllowed Whether the checkout root is acceptable.
	 * @returns Absolute checked path.
	 */
	static path(root: string, relative: string, isRootAllowed = false): string {
		const resolved = Path.resolve(root, relative);
		if (Path.isAbsolute(relative) === true || (resolved === root && isRootAllowed === false)
			|| (resolved !== root && resolved.startsWith(`${root}${Path.sep}`) === false)) {
			throw new Error(`Path must stay inside the checkout: ${relative}`);
		}
		let current = root;
		for (const segment of Path.relative(root, resolved).split(Path.sep)) {
			if (segment === '.git') {
				throw new Error('Git metadata is not build output.');
			}
			current = Path.join(current, segment);
			if (Fs.lstatSync(current, {
				throwIfNoEntry: false,
			})?.isSymbolicLink() === true) {
				throw new Error(`Symbolic link is not permitted in managed paths: ${current}`);
			}
		}
		return resolved;
	}

	/**
	 * Rejects output folders containing tracked source files or symbolic links.
	 * @param root Checkout root.
	 * @param relative Configured output directory.
	 * @returns Validated absolute output directory.
	 */
	static target(root: string, relative: string): string {
		const target = Configuration.path(root, relative);
		for (const file of WorktreeGit.listTrackedFiles(root)) {
			const absolute = Path.resolve(root, file);
			if (absolute === target || absolute.startsWith(`${target}${Path.sep}`)) {
				throw new Error(`Refusing to manage tracked sources: ${target}`);
			}
		}
		return target;
	}
}

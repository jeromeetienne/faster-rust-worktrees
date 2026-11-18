import Fs from 'node:fs';
import Path from 'node:path';
import * as Yaml from 'yaml';
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
	/** Default configuration filename in the main checkout. */
	static readonly DEFAULT_FILENAME = '.faster_rust_worktrees.yaml';

	/**
	 * Reads a receiving repository's configuration.
	 * @param root Checkout root.
	 * @param file Relative configuration filename.
	 * @returns Validated repository settings.
	 */
	static read(root: string, file = Configuration.DEFAULT_FILENAME): RepositoryConfiguration {
		if (process.env.CARGO_TARGET_DIR !== undefined) {
			throw new Error('Unset CARGO_TARGET_DIR; configure checkout-local targetDirectories instead.');
		}
		const content = Configuration._readContent(root, file);
		const extension = Path.extname(file).toLowerCase();
		const isYaml = extension === '.yaml' || extension === '.yml';
		return Configuration._validate(root, isYaml ? Yaml.parse(content) : JSON.parse(content));
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
		Configuration._validateTargets(root, [target]);
		return target;
	}

	/**
	 * Resolves target folders using one tracked-file listing for the checkout.
	 * @param root Checkout root.
	 * @param relatives Distinct configured output directories.
	 * @returns Validated absolute paths keyed by configured output directory.
	 */
	static targets(root: string, relatives: ReadonlySet<string>): Map<string, string> {
		const targets = new Map<string, string>();
		for (const relative of relatives) {
			targets.set(relative, Configuration.path(root, relative));
		}
		Configuration._validateTargets(root, targets.values());
		return targets;
	}

	/**
	 * Rejects any target that contains tracked files.
	 * @param root Checkout root.
	 * @param targets Resolved target paths.
	 * @returns Nothing.
	 */
	private static _validateTargets(root: string, targets: Iterable<string>): void {
		const trackedPaths = WorktreeGit.listTrackedFiles(root).map((file) => Path.resolve(root, file));
		for (const target of targets) {
			for (const trackedPath of trackedPaths) {
				if (trackedPath === target || trackedPath.startsWith(`${target}${Path.sep}`)) {
					throw new Error(`Refusing to manage tracked sources: ${target}`);
				}
			}
		}
	}

	/**
	 * Reads configuration and migrates the previous default when needed.
	 * @param root Main checkout root.
	 * @param file Requested configuration filename.
	 * @returns Configuration file contents.
	 */
	private static _readContent(root: string, file: string): string {
		const destination = Path.resolve(root, file);
		try {
			return Fs.readFileSync(destination, 'utf8');
		} catch (error) {
			if (file !== Configuration.DEFAULT_FILENAME || (error as NodeJS.ErrnoException).code !== 'ENOENT') {
				throw error;
			}
		}

		const legacy = Path.join(root, '.faster_rust_worktrees.json');
		const configuration = Configuration._validate(root, JSON.parse(Fs.readFileSync(legacy, 'utf8')));
		const temporaryDirectory = Fs.mkdtempSync(Path.join(root, '.faster_rust_worktrees-'));
		try {
			const temporaryFile = Path.join(temporaryDirectory, file);
			Fs.writeFileSync(temporaryFile, Yaml.stringify(configuration), {
				mode: 0o600,
			});
			try {
				Fs.linkSync(temporaryFile, destination);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
					throw error;
				}
			}
		} finally {
			Fs.rmSync(temporaryDirectory, {
				recursive: true,
				force: true,
			});
		}
		return Fs.readFileSync(destination, 'utf8');
	}

	/**
	 * Validates settings and ensures that managed paths stay inside the checkout.
	 * @param root Main checkout root.
	 * @param value Parsed configuration.
	 * @returns Validated repository settings.
	 */
	private static _validate(root: string, value: unknown): RepositoryConfiguration {
		const configuration = configurationSchema.parse(value);
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
}

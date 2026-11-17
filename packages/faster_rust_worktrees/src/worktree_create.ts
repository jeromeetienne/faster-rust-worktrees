import Fs from 'node:fs';
import Path from 'node:path';
import { Configuration } from './configuration.js';
import type { RepositoryConfiguration } from './configuration.js';
import { DirectoryClone } from './directory_clone.js';
import { SourceDates } from './source_dates.js';
import { WorktreeGit } from './worktree_git.js';
import { BuildScriptOutputs } from './build_script_outputs.js';
import { ProcessCommand } from './process_command.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	WorktreeCreate — creates independent worktrees with optional Cargo output reuse
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Configurable extraction of Heidrun Code's worktree creation mechanism. */
export class WorktreeCreate {
	/**
	 * Creates a worktree, initializes submodules, optionally clones output, then installs dependencies.
	 * @param root Main checkout root.
	 * @param name New branch name.
	 * @param configuration Receiving-repository settings.
	 * @param isWithoutOptimization Whether to create an ordinary worktree.
	 * @param baseRef Optional base reference override.
	 * @returns Worktree path, clone decisions, and relocated record count.
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
		return {
			worktreePath,
			decisions,
			rewrittenRecords,
		};
	}
}

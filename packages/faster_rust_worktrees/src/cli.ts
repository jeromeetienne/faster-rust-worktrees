#!/usr/bin/env -S npx --no-install tsx
import { Command } from 'commander';
import { Configuration } from './repository/configuration.js';
import { WorktreeGit } from './repository/worktree_git.js';
import { WorktreeCreate } from './worktrees/worktree_create.js';
import { TargetCleanup } from './worktrees/target_cleanup.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Cli — shared command line entry point
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Command-line interface used both locally and by the GitHub npm entry package. */
export class Cli {
	/**
	 * Runs argument parsing and reports operational errors with a nonzero exit code.
	 * @param argv Process arguments.
	 * @returns Nothing.
	 */
	static run(argv: string[]): void {
		const command = new Command();
		command.name('faster_rust_worktrees').description('Reuse independent Cargo output in Git worktrees')
			.option('--config <path>', 'configuration relative to the main checkout', '.faster_rust_worktrees.json');
		command.command('create <branch>').option('--base <reference>', 'base reference override')
			.option('--without-optimization', 'create an ordinary worktree')
			.action((branch: string, options: { base?: string; withoutOptimization?: boolean }) => {
				const root = WorktreeGit.findMainCheckoutPath(process.cwd());
				const configuration = Configuration.read(root, command.opts().config);
				console.log(JSON.stringify(WorktreeCreate.run(root, branch, configuration,
					options.withoutOptimization === true, options.base), null, 2));
			});
		command.command('clean').description('Preview old worktree build folders')
			.option('--days <number>', 'minimum age in days', '14')
			.option('--apply', 'remove the printed candidates; stop all builds first')
			.action((options: { days: string; apply?: boolean }) => {
				const root = WorktreeGit.findMainCheckoutPath(process.cwd());
				const configuration = Configuration.read(root, command.opts().config);
				const entries = TargetCleanup.stale(root, configuration, Number(options.days));
				console.log(JSON.stringify(entries, null, 2));
				if (options.apply === true) {
					TargetCleanup.remove(entries);
				}
			});
		command.command('prune').description('Preview obsolete hashed Cargo output')
			.option('--apply', 'remove printed candidates; stop other builds first')
			.action((options: { apply?: boolean }) => {
				const root = WorktreeGit.findMainCheckoutPath(process.cwd());
				const configuration = Configuration.read(root, command.opts().config);
				const checkout = WorktreeGit.findCheckoutPath(process.cwd());
				const entries = TargetCleanup.obsolete(checkout, configuration);
				console.log(JSON.stringify(entries, null, 2));
				if (options.apply === true) {
					TargetCleanup.remove(entries);
				}
			});
		try {
			command.parse(argv);
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
		}
	}
}

Cli.run(process.argv);

import Assert from 'node:assert/strict';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import ChildProcess from 'node:child_process';
import Test from 'node:test';
import { z } from 'zod';
import { Configuration, configurationSchema } from '../src/configuration.js';
import { WorktreeCreate } from '../src/worktree_create.js';
import { DirectoryClone } from '../src/directory_clone.js';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SafetyTest — configuration, failure reporting, and canonical skill validation
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Exercises failure paths without mutating developer repositories. */
class SafetyTest {
	/**
	 * Registers fixture-based safety checks.
	 * @returns Nothing.
	 */
	static register(): void {
		Test('Zod validates the shipped skill frontmatter', () => {
			const skill = Fs.readFileSync(Path.resolve(__dirname,
				'../../..', 'skills/faster_rust_worktrees/SKILL.md'), 'utf8');
			const frontmatter = /^---\n([\s\S]*?)\n---/.exec(skill)?.[1];
			Assert.notEqual(frontmatter, undefined);
			const fields = Object.fromEntries((frontmatter ?? '').split('\n').map((line) => {
				const separator = line.indexOf(':');
				return [line.slice(0, separator), line.slice(separator + 1).trim()];
			}));
			z.object({
				name: z.literal('faster_rust_worktrees'),
				description: z.string().min(20),
			}).strict().parse(fields);
		});
		Test('missing output and failed installation are explicit; existing clone destinations survive', () => {
			const directory = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'faster-rust-safety-'));
			const root = Fs.realpathSync(directory);
			try {
				SafetyTest._git(root, ['init', '-q']);
				Fs.writeFileSync(Path.join(root, 'source.txt'), 'source');
				Fs.writeFileSync(Path.join(root, '.gitignore'), '.agents/worktree/\n');
				SafetyTest._git(root, ['add', '.']);
				SafetyTest._git(root, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
					'commit', '-qm', 'Fixture']);
				const configuration = configurationSchema.parse({
					cargoCommands: [{
						cwd: '.',
						argv: ['cargo', 'build'],
					}],
				});
				const missing = WorktreeCreate.run(root, 'missing', configuration);
				Assert.match(missing.decisions[0], /missing build output/);
				const failed = configurationSchema.parse({
					...configuration,
					installCommand: {
						cwd: '.',
						argv: [process.execPath, '-e', 'process.exit(7)'],
					},
				});
				Assert.throws(() => WorktreeCreate.run(root, 'failed-install', failed), /Worktree retained/);
				Assert.ok(Fs.existsSync(Path.join(root, '.agents/worktree/failed-install/source.txt')));
				Assert.throws(() => WorktreeCreate.run(root, 'missing', configuration));
				Assert.throws(() => WorktreeCreate.run(root, '../escape', configuration));
				Assert.throws(() => WorktreeCreate.run(root, 'not-ignored', {
					...configuration,
					worktreeDirectory: 'not-ignored',
				}), /Ignore/);
				Assert.throws(() => DirectoryClone.clone(root, missing.worktreePath), /destination exists/);
				Assert.equal(Fs.readFileSync(Path.join(missing.worktreePath, 'source.txt'), 'utf8'), 'source');
				Fs.writeFileSync(Path.join(root, 'invalid.json'), JSON.stringify({
					...configuration,
					targetDirectories: ['.'],
				}));
				Assert.throws(() => Configuration.read(root, 'invalid.json'), /inside the checkout/);
			} finally {
				Fs.rmSync(root, {
					recursive: true,
					force: true,
				});
			}
		});
	}

	/**
	 * Runs Git in a disposable checkout.
	 * @param cwd Fixture root.
	 * @param argv Git arguments.
	 * @returns Nothing.
	 */
	private static _git(cwd: string, argv: string[]): void {
		const result = ChildProcess.spawnSync('git', argv, {
			cwd,
			encoding: 'utf8',
		});
		Assert.equal(result.status, 0, result.stderr);
	}
}

SafetyTest.register();

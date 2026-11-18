import Assert from 'node:assert/strict';
import ChildProcess from 'node:child_process';
import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import Test from 'node:test';
import { Configuration, configurationSchema } from '../src/repository/configuration.js';
import { WorktreeCreate } from '../src/worktrees/worktree_create.js';
import { TargetCleanup } from '../src/worktrees/target_cleanup.js';
import { WorktreeGit } from '../src/repository/worktree_git.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	IntegrationTest — real Git, file-system cloning, and Cargo correctness
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Disposable fixture exercising observable behavior rather than implementation details. */
class IntegrationTest {
	/**
	 * Registers a representative real Cargo integration scenario.
	 * @returns Nothing.
	 */
	static register(): void {
		Test('Cargo reuse after moving sibling dependencies into a shared workspace', () => {
			const directory = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'faster-rust-workspace-'));
			const root = Fs.realpathSync(directory);
			const build = ['cargo', 'build', '--frozen'];
			const configuration = configurationSchema.parse({
				cargoCommands: [{
					cwd: 'app',
					argv: build,
				}],
			});
			const commit = ['git', '-c', 'user.name=Fixture', '-c',
				'user.email=fixture@example.invalid', 'commit', '-qm'];
			const workspace = Path.join(root, 'Cargo.toml');
			try {
				IntegrationTest._fixture(root);
				const workspaceManifest = Fs.readFileSync(workspace);
				Fs.unlinkSync(workspace);
				const libraryManifest = Path.join(root, 'shared/Cargo.toml');
				const libraryPackage = Fs.readFileSync(libraryManifest);
				Fs.appendFileSync(libraryManifest, '\n[workspace]\nresolver="2"\n');
				Fs.mkdirSync(Path.join(root, '.cargo'));
				Fs.writeFileSync(Path.join(root, '.cargo/config.toml'), '[build]\ntarget-dir = "target"\n');
				IntegrationTest._run(root, ['git', 'init', '-q']);
				const app = Path.join(root, 'app');
				IntegrationTest._run(app, ['cargo', 'build', '--offline']);
				Assert.doesNotMatch(IntegrationTest._run(app, build), /Compiling /);
				IntegrationTest._run(root, ['git', 'add', '.']);
				IntegrationTest._run(root, [...commit, 'Separate workspaces']);
				const separate = WorktreeCreate.run(root, 'separate', configuration);
				Assert.match(separate.decisions[0], /copy-on-write cloned/);
				Assert.equal(separate.warnings.length, 1);
				Assert.match(separate.warnings[0], /shared \(shared\/Cargo.toml\) is outside Cargo workspace app/);
				const rebuilt = IntegrationTest._run(Path.join(separate.worktreePath, 'app'), build);
				console.log(`Separate workspaces:\n${rebuilt}`);
				Assert.match(rebuilt, /Compiling shared /);
				Assert.match(rebuilt, /Compiling app /);

				Fs.writeFileSync(workspace, workspaceManifest);
				Fs.writeFileSync(libraryManifest, libraryPackage);
				const lockfile = Fs.readFileSync(Path.join(app, 'Cargo.lock'));
				Fs.renameSync(Path.join(app, 'Cargo.lock'), Path.join(root, 'Cargo.lock'));
				IntegrationTest._run(app, build);
				Assert.deepEqual(Fs.readFileSync(Path.join(root, 'Cargo.lock')), lockfile);
				IntegrationTest._run(root, ['git', 'add', '.']);
				IntegrationTest._run(root, [...commit, 'Shared workspace']);

				const first = WorktreeCreate.run(root, 'shared-first', configuration);
				const second = WorktreeCreate.run(root, 'shared-second', configuration);
				for (const worktree of [first, second]) {
					Assert.match(worktree.decisions[0], /copy-on-write cloned/);
					Assert.deepEqual(worktree.warnings, []);
					const unchanged = IntegrationTest._run(Path.join(worktree.worktreePath, 'app'), build);
					console.log(`Shared workspace:\n${unchanged}`);
					Assert.doesNotMatch(unchanged, /Compiling /);
				}
				Fs.writeFileSync(Path.join(first.worktreePath, 'shared/src/lib.rs'),
					'/// Returns the changed fixture value.\npub fn value() -> u32 {\n    43\n}\n');
				const changed = IntegrationTest._run(Path.join(first.worktreePath, 'app'), build);
				console.log(`Changed sibling dependency:\n${changed}`);
				Assert.match(changed, /Compiling shared /);
				Assert.match(changed, /Compiling app /);
				Assert.equal(IntegrationTest._run(first.worktreePath, ['target/debug/app']).trim(), '43');
				Assert.doesNotMatch(IntegrationTest._run(app, build), /Compiling /);
				Assert.doesNotMatch(IntegrationTest._run(Path.join(second.worktreePath, 'app'), build), /Compiling /);
				Assert.equal(IntegrationTest._run(root, ['target/debug/app']).trim(), '42');
				Assert.equal(IntegrationTest._run(second.worktreePath, ['target/debug/app']).trim(), '42');
			} finally {
				Fs.rmSync(directory, {
					recursive: true,
					force: true,
				});
			}
		});

		Test('independent Cargo reuse, changed behavior, concurrency, ordinary creation, and cleanup', async () => {
			const directory = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'faster-rust-integration-'));
			const root = Path.join(Fs.realpathSync(directory), 'main');
			try {
				Fs.mkdirSync(root);
				IntegrationTest._fixture(root);
				IntegrationTest._run(root, ['git', 'init', '-q']);
				Fs.writeFileSync(Path.join(root, '.faster_rust_worktrees.yaml'), [
					'cargoCommands:',
					'  - cwd: app',
					'    argv: [cargo, build, --offline]',
					'  - cwd: app',
					'    argv: [cargo, test, --offline, --no-run]',
					'',
				].join('\n'));
				const configuration = Configuration.read(root);
				const yamlPath = Path.join(root, '.faster_rust_worktrees.yaml');
				const yaml = Fs.readFileSync(yamlPath, 'utf8');
				const legacyPath = Path.join(root, '.faster_rust_worktrees.json');
				const legacy = JSON.stringify(configuration);
				Fs.writeFileSync(legacyPath, legacy);
				Fs.unlinkSync(yamlPath);
				Assert.deepEqual(Configuration.read(root), configuration);
				Assert.match(Fs.readFileSync(yamlPath, 'utf8'), /^baseRef: HEAD/m);
				Assert.equal(Fs.readFileSync(legacyPath, 'utf8'), legacy);
				Fs.writeFileSync(yamlPath, yaml);
				Fs.writeFileSync(legacyPath, 'invalid JSON');
				Assert.deepEqual(Configuration.read(root), configuration);
				Assert.equal(Fs.readFileSync(yamlPath, 'utf8'), yaml);
				Fs.unlinkSync(legacyPath);
				IntegrationTest._run(root, ['cargo', 'build', '--offline']);
				IntegrationTest._run(root, ['cargo', 'test', '--offline', '--no-run']);
				IntegrationTest._run(root, ['git', 'add', '.']);
				IntegrationTest._run(root, ['git', '-c', 'user.name=Fixture', '-c',
					'user.email=fixture@example.invalid', 'commit', '-qm', 'Fixture']);
				const first = WorktreeCreate.run(root, 'first', configuration);
				Assert.match(first.decisions[0], /copy-on-write cloned/);
				Assert.ok(first.rewrittenRecords > 0);
				Assert.equal(Fs.statSync(Path.join(first.worktreePath, 'app/src/main.rs'), {
					bigint: true,
				}).mtimeNs, Fs.statSync(Path.join(root, 'app/src/main.rs'), {
					bigint: true,
				}).mtimeNs);
				const unchanged = IntegrationTest._run(Path.join(first.worktreePath, 'app'),
					['cargo', 'build', '--offline']);
				console.log(`Unchanged first build:\n${unchanged}`);
				Assert.doesNotMatch(unchanged, /Compiling /);
				const second = WorktreeCreate.run(root, 'second', configuration);
				Fs.writeFileSync(Path.join(first.worktreePath, 'shared/src/lib.rs'),
					'/// Returns the fixture value.\npub fn value() -> u32 {\n    43\n}\n');
				const results = await Promise.all([
					IntegrationTest._runAsync(first.worktreePath, ['cargo', 'run', '--offline', '--quiet', '-p', 'app']),
					IntegrationTest._runAsync(second.worktreePath, ['cargo', 'run', '--offline', '--quiet', '-p', 'app']),
				]);
				Assert.equal(results[0].trim(), '43');
				Assert.equal(results[1].trim(), '42');
				Assert.equal(IntegrationTest._run(root, ['target/debug/app']).trim(), '42');
				const ordinary = WorktreeCreate.run(root, 'ordinary', configuration, true);
				Assert.equal(Fs.existsSync(Path.join(ordinary.worktreePath, 'target')), false);
				const changed = Path.join(root, 'shared/src/lib.rs');
				Fs.writeFileSync(changed, '/// Returns a changed value.\npub fn value() -> u32 {\n    44\n}\n');
				IntegrationTest._run(root, ['cargo', 'build', '--offline']);
				const different = WorktreeCreate.run(root, 'different', configuration);
				Assert.equal(IntegrationTest._run(different.worktreePath,
					['cargo', 'run', '--offline', '--quiet', '-p', 'app']).trim(), '42');
				Fs.writeFileSync(changed, '/// Returns the fixture value.\npub fn value() -> u32 {\n    42\n}\n');
				const old = Path.join(root, 'target/debug/deps/obsolete-0123456789abcdef.rlib');
				Fs.writeFileSync(old, 'obsolete output');
				const unknown = Path.join(root, 'target/debug/deps/unknown');
				Fs.writeFileSync(unknown, 'retain');
				const plan = TargetCleanup.obsolete(root, configuration);
				Assert.ok(plan.some((entry) => entry.path === old));
				Assert.equal(Fs.existsSync(old), true);
				TargetCleanup.remove(plan);
				Assert.equal(Fs.existsSync(old), false);
				Assert.equal(Fs.existsSync(unknown), true);
				Assert.doesNotMatch(IntegrationTest._run(root, ['cargo', 'build', '--offline']), /Compiling /);
				Assert.equal(TargetCleanup.stale(root, configuration, 14).length, 0);
				const oldDate = new Date(Date.now() - 30 * 86400000);
				const staleTarget = Path.join(first.worktreePath, 'target');
				for (const path of Fs.readdirSync(staleTarget, {
					recursive: true,
				}).map((entry) => Path.join(staleTarget, String(entry))).reverse()) {
					Fs.utimesSync(path, oldDate, oldDate);
				}
				Fs.utimesSync(staleTarget, oldDate, oldDate);
				const stale = TargetCleanup.stale(root, configuration, 14);
				Assert.equal(stale.length, 1);
				Assert.equal(TargetCleanup.stale(root, configuration, 14).length, 1);
				Assert.equal(TargetCleanup.stale(root, configuration, 14).length, 1);
				Assert.equal(stale[0].checkout, first.worktreePath);
				TargetCleanup.remove(stale);
				Assert.equal(Fs.existsSync(staleTarget), false);
				Assert.ok(Fs.existsSync(Path.join(first.worktreePath, 'shared/src/lib.rs')));
				Assert.ok(Fs.existsSync(Path.join(root, 'target/debug/app')));
				Assert.throws(() => Configuration.path(root, '../escape'));
				Assert.throws(() => Configuration.target(root, 'shared'));
				Fs.symlinkSync(Path.join(root, 'shared'), Path.join(root, 'linked'));
				Assert.throws(() => Configuration.path(root, 'linked/src'));
				Assert.equal(WorktreeGit.findMainCheckoutPath(second.worktreePath), root);
				const unavailable = configurationSchema.parse({
					cargoCommands: [{
						cwd: '.',
						argv: ['cargo', '--version'],
					}],
				});
				Assert.throws(() => TargetCleanup.obsolete(root, unavailable), /Unrecognized Cargo output/);
				const failed = configurationSchema.parse({
					cargoCommands: [{
						cwd: '.',
						argv: ['cargo', 'not-a-command'],
					}],
				});
				Assert.throws(() => TargetCleanup.obsolete(root, failed), /failed/);
				// Hide source packages only inside this disposable fixture.
				Fs.renameSync(Path.join(root, 'shared'), Path.join(root, 'shared-hidden'));
				Assert.equal(IntegrationTest._run(second.worktreePath,
					['cargo', 'run', '--offline', '--quiet', '-p', 'app']).trim(), '42');
			} finally {
				Fs.rmSync(directory, {
					recursive: true,
					force: true,
				});
			}
		});
	}

	/**
	 * Creates a multi-package workspace with a shared dependency and an absolute build-script watch path.
	 * @param root Fixture root.
	 * @returns Nothing.
	 */
	private static _fixture(root: string): void {
		const files: Record<string, string> = {
			'Cargo.toml': '[workspace]\nmembers=["shared", "app"]\nresolver="2"\n',
			'shared/Cargo.toml': '[package]\nname="shared"\nversion="0.1.0"\nedition="2021"\n',
			'shared/src/lib.rs': '/// Returns the fixture value.\npub fn value() -> u32 {\n    42\n}\n',
			'app/Cargo.toml': '[package]\nname="app"\nversion="0.1.0"\nedition="2021"\n'
				+ '[dependencies]\nshared={path="../shared"}\n',
			'app/src/main.rs': 'fn main() {\n    println!("{}", shared::value());\n}\n',
			'app/build.rs': 'fn main() {\n    println!("cargo:rerun-if-changed={}/src/main.rs", '
				+ 'std::env::var("CARGO_MANIFEST_DIR").unwrap());\n}\n',
			'.gitignore': 'target/\n.agents/worktree/\n',
		};
		for (const [relative, text] of Object.entries(files)) {
			const path = Path.join(root, relative);
			Fs.mkdirSync(Path.dirname(path), {
				recursive: true,
			});
			Fs.writeFileSync(path, text);
		}
	}

	/**
	 * Runs a synchronous fixture process.
	 * @param cwd Working directory.
	 * @param argv Executable and arguments.
	 * @returns Combined output.
	 */
	private static _run(cwd: string, argv: string[]): string {
		const result = ChildProcess.spawnSync(argv[0], argv.slice(1), {
			cwd,
			encoding: 'utf8',
			env: {
				...process.env,
				CARGO_TARGET_DIR: undefined,
				CARGO_TERM_COLOR: 'never',
			},
		});
		Assert.equal(result.status, 0, `${argv.join(' ')}\n${result.stdout}\n${result.stderr}`);
		return `${result.stdout}${result.stderr}`;
	}

	/**
	 * Runs independent builds concurrently.
	 * @param cwd Working directory.
	 * @param argv Executable and arguments.
	 * @returns Process output.
	 */
	private static async _runAsync(cwd: string, argv: string[]): Promise<string> {
		return await new Promise((resolve, reject) => {
			ChildProcess.execFile(argv[0], argv.slice(1), {
				cwd,
				env: {
					...process.env,
					CARGO_TARGET_DIR: undefined,
				},
			}, (error, stdout, stderr) => {
				if (error !== null) {
					reject(error);
					return;
				}
				resolve(`${stdout}${stderr}`);
			});
		});
	}
}

IntegrationTest.register();

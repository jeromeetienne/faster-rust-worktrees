# faster_rust_worktrees

The reusable command-line tool behind Faster Rust Work Trees. The intended user workflow is through the [faster_rust_worktrees skill](../../skills/faster_rust_worktrees/SKILL.md), as explained in the [root README](../../README.md). This README documents direct tool use and development.

## Run the tool

Run the shared tool directly from GitHub:

```bash
npx --yes github:jeromeetienne/faster_rust_worktrees --help
```

No npm publication is needed. For repeatable automation, pin an available Git reference by appending `#<reference>` to the GitHub package name.

### Configure once

Start from the [configuration example](../../skills/faster_rust_worktrees/references/setup.md#configuration). Set the base reference, worktree location, build folders, and Cargo commands with their actual working directories. An optional installation command supports repositories with additional dependencies.

Create `.faster_rust_worktrees.yaml` at the root of the main checkout. For a repository that builds and tests from its root:

```yaml
baseRef: HEAD
worktreeDirectory: .agents/worktree
targetDirectories: [target]
cargoCommands:
  - cwd: "."
    argv: [cargo, build, --locked]
  - cwd: "."
    argv: [cargo, test, --locked, --no-run]
```

If the default YAML file is missing, the first command that loads configuration converts an existing `.faster_rust_worktrees.json` to `.faster_rust_worktrees.yaml` and loads the new file. The original JSON file stays in place. An existing JSON configuration can also be selected with `--config .faster_rust_worktrees.json` before the subcommand.

An optional `installCommand` uses the same `cwd` and `argv` fields as a Cargo command. Commands run without a shell. Multiple checkout-local target directories are supported. Place `--config <path>` before the subcommand to use another configuration file.

Ignore the nested worktree folder in Git, commit the configuration, and build the main checkout with the commands your worktrees will use. Stop builds while cloning.

### Create a worktree

From your Rust repository:

```bash
npx --yes github:jeromeetienne/faster_rust_worktrees create fix-example
```

Run your usual build and test commands inside the new worktree. Check the reported clone decisions. Missing build output or unavailable cloning is reported explicitly.

For an ordinary worktree without build reuse:

```bash
npx --yes github:jeromeetienne/faster_rust_worktrees create ordinary-example --without-optimization
```

## What makes reuse work

1. **Independent build folders, shared unchanged blocks.** Copy-on-write cloning gives each worktree its own output. Writing in one worktree leaves the other worktrees independent.
2. **Exact source dates.** Only identical tracked files receive the original timestamps, preserving nanosecond precision so Cargo can recognize unchanged sources.
3. **Relocated build-script records.** Recorded checkout paths are updated for the new worktree, with record dates preserved.
4. **Your repository's commands.** Cargo runs from the configured package directories, with the features and profiles your repository actually uses.

The technique comes from [Heidrun Code](https://github.com/heidrun-org/heidrun_code/tree/main/packages/dev_tools/worktree_tools). Faster Rust Work Trees extracts the reusable mechanism into a pnpm monorepo with a shared TypeScript tool, a portable skill, and real Git and Cargo tests.

## Reuse builds with local dependencies

A `copy-on-write cloned` decision confirms that the new worktree has a copy of the build files. Cargo decides separately whether to reuse those files. For a local dependency outside the Cargo workspace root, Cargo includes the absolute path in the identity it uses for compiled output. The path changes in a fresh worktree, so Cargo can rebuild the dependency and packages that use it.

After a successful clone, `create` reports these dependencies by package name and manifest path in `warnings`. The check uses offline, locked Cargo metadata for direct `cargo` entries in `cargoCommands`. Configure the underlying Cargo commands with their working directories if a package manager or script normally invokes Cargo. Metadata can fail if required dependencies are missing from the local Cargo cache. Verify reuse with the actual first build in every case.

To enable reuse for sibling packages in the same Git repository:

1. Add a shared `[workspace]` manifest in a directory above the application and all affected local dependencies. List the packages as workspace members, remove their nested workspace declarations, and update any explicit `package.workspace` paths. Review workspace settings such as the dependency resolver, profiles, and patches before consolidating them.
2. Review the lockfile changes. Use the existing application lockfile as the starting point for the shared workspace lockfile. Check a build with `--locked`. If Cargo requires changes, review the resolved dependency differences before committing the shared lockfile and removing the superseded lockfiles.
3. Keep the output inside each checkout. Update the commands and target paths in the Faster Rust Work Trees configuration if the workspace move changes them. Commit the setup, build the main checkout with the usual commands, and create a worktree at the same revision.
4. Run the same build in the new worktree and confirm that Cargo prints no `Compiling` lines. In a disposable worktree, edit a local dependency and check that the affected packages rebuild and only that worktree's executable behavior changes.

See [the Heidrun Data reproduction and measurements](https://github.com/jeromeetienne/faster_rust_worktrees/issues/21).

## Keep build output under control

Preview old worktree build folders:

```bash
npx --yes github:jeromeetienne/faster_rust_worktrees clean --days 14
```

Preview obsolete Cargo output using the configured build commands:

```bash
npx --yes github:jeromeetienne/faster_rust_worktrees prune
```

Both commands preview paths by default. Add `--apply` to remove the selected output, with builds stopped. Unknown output is retained; failed commands or unrecognized Cargo logs prevent pruning.

## Requirements and limits

- Node.js 20.11 or later, Git, Rust, Cargo, Python 3, and a file system supporting copy-on-write cloning.
- macOS has live verification for real cloning, Cargo builds, source changes, concurrent worktrees, and cleanup.
- Linux uses GNU `cp --reflink=always`; live evaluation on a suitable file system is still pending.

Keep Cargo output inside each checkout and unset `CARGO_TARGET_DIR`. Inspect package-level Cargo configuration for absolute output paths too. Stop builds before cloning and cleanup; cloning output while a build is writing to that output does not produce a consistent snapshot.

Python 3 preserves nanosecond timestamps. Only identical tracked regular files receive the original dates; changed or uncertain files keep timestamps that allow Cargo to rebuild. Cloning failures are reported without an ordinary-copy or hard-link fallback.

Generated files outside Cargo output, native caches, external dependencies, and paths embedded in compiled programs may need repository-specific setup. The tool does not rewrite Cargo manifests or lockfiles.

Cleanup previews selected paths by default. Removal requires `--apply`; stale-age checks are a heuristic, and pruning must cover every build variant you want to keep. See the [full configuration and limits](../../skills/faster_rust_worktrees/references/setup.md) before applying cleanup.

## Develop Faster Rust Work Trees

From this repository, using pnpm 10:

```bash
pnpm install --frozen-lockfile
pnpm dev --help
pnpm check
pnpm test
```

Tests create disposable Git and Rust projects and remove the fixtures afterward. No server is started.

```text
packages/faster_rust_worktrees/       shared tool and real Cargo tests
skills/faster_rust_worktrees/  canonical skill and configuration reference
docs/                         measurements, raw evidence, and reproduction methods
```

[MIT license](../../LICENSE) · [Source attribution](../../NOTICE.md)

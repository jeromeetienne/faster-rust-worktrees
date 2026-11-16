# Faster Rust Work Trees

**Build once. Start the next worktree faster.**

A new Rust worktree usually starts with an empty build folder. Faster Rust Work Trees reuses the build you already have, giving each worktree independent Cargo output while sharing unchanged disk blocks.

**Ten built ripgrep worktrees: 2,942 MB of added space becomes 50 MB.**

A reusable tool does the work. The [faster_rust_worktrees skill](skills/faster_rust_worktrees/SKILL.md) helps your coding agent configure the tool for your repository.

## The difference, measured

Creating one worktree **and completing its first build**, with the main checkout already built:

| Project | Ordinary | Optimized | Less waiting |
|---|---:|---:|---:|
| ripgrep | 6.979 seconds | **0.606 seconds** | **91.3%** |
| fd | 6.207 seconds | **0.546 seconds** | **91.2%** |

Added allocated space **after building every worktree**:

| Project | Worktrees | Ordinary | Optimized | Space reduction |
|---|---:|---:|---:|---:|
| ripgrep | 1 | 294 MB | **5.0 MB** | **98.3%** |
| ripgrep | 10 | 2,942 MB | **50.1 MB** | **98.3%** |
| fd | 1 | 161 MB | **1.3 MB** | **99.2%** |
| fd | 10 | 1,613 MB | **12.8 MB** | **99.2%** |

Each comparison was repeated three times; the tables show medians. All optimized first builds compiled **zero crates**. Ten-worktree space was measured with ten built worktrees present together, rather than estimated from one worktree.

Measured on macOS with unchanged debug builds. Space excludes the built main checkout and common Cargo caches; MB means 1,000,000 bytes. Allocated space was measured inside an isolated Apple File System volume, counting shared blocks once. Source changes and other environments can change the savings.

Read the [timing results and commands](https://github.com/jeromeetienne/faster-rust-worktrees/issues/3#issuecomment-6919366785), [space results and measurement method](https://github.com/jeromeetienne/faster-rust-worktrees/issues/3#issuecomment-6919213926), or the [full evaluation](docs/evaluation.md).

## Disk lifetime: every unnecessary write adds up

**You can delete a build folder. You cannot undo flash wear.**

A solid-state drive (SSD) has finite write endurance. Its flash memory can withstand a limited number of write-and-erase cycles. Rebuilding unchanged dependencies repeatedly creates avoidable write activity, even when plenty of disk space is free. Drive manufacturers describe endurance in terms of how much data can be written over the drive's life; [Kingston explains the limits and the role of write activity](https://www.kingston.com/unitedkingdom/en/ssd/ssd-faq).

A **30 GB Cargo build folder** makes the stakes easier to see. Create fresh worktrees throughout the day, rebuild the same dependencies, delete the output, and repeat: the free-space counter recovers, but the writes have already happened. The 30 GB example illustrates a larger workload; our benchmarks used smaller projects.

Faster Rust Work Trees shares existing build blocks and reuses compiled dependencies. Each optimized worktree in our tests completed its unchanged first build with **zero crates compiled**. That avoids regenerating the same dependency artifacts and is expected to reduce unnecessary writes as worktrees are created repeatedly. The benefit matters even when the disk has room to spare.

For ten fd worktrees, the measured added allocation fell from **1,613 MB to 12.8 MB**—about **1/126 of the ordinary allocation**. Ten ripgrep worktrees used about **1/59 of the ordinary added allocation**. These are substantial storage savings, with a practical reason to care about the writes avoided along the way.

**An estimated 126-fold increase in lifetime before flash wear, under the stated assumptions.** If the 126-fold allocation reduction corresponds to 126-fold fewer wear-causing writes, and repeated worktree operations dominate the drive’s writes, the lifetime before flash wear would be approximately **126 times as long** at the same operation frequency. This is an assumption-based lifetime estimate; the directly measured result is the allocation reduction.

## Bring the tool to your repository

Run the shared tool directly from GitHub:

```bash
npx --yes github:jeromeetienne/faster-rust-worktrees --help
```

No npm publication is needed. For repeatable automation, pin an available Git reference by appending `#<reference>` to the GitHub package name.

Have your coding agent read the [faster_rust_worktrees skill](skills/faster_rust_worktrees/SKILL.md), or copy the skill folder into your agent's skill directory and ask:

> Use faster_rust_worktrees to configure this Rust repository. Find the real build and test commands, verify copy-on-write cloning on this file system, and check that unchanged builds reuse Cargo output while source changes still produce the correct result.

The receiving repository keeps its own configuration. The implementation stays in Faster Rust Work Trees.

### Configure once

Start from the [configuration example](skills/faster_rust_worktrees/references/setup.md#configuration). Set the base reference, worktree location, build folders, and Cargo commands with their actual working directories. An optional installation command supports repositories with additional dependencies.

Ignore the nested worktree folder in Git, commit the configuration, and build the main checkout with the commands your worktrees will use. Stop builds while cloning.

### Create a worktree

From your Rust repository:

```bash
npx --yes github:jeromeetienne/faster-rust-worktrees create fix-example
```

Run your usual build and test commands inside the new worktree. Check the reported clone decisions. Missing build output or unavailable cloning is reported explicitly.

For an ordinary worktree without build reuse:

```bash
npx --yes github:jeromeetienne/faster-rust-worktrees create ordinary-example --without-optimization
```

## What makes reuse work

1. **Independent build folders, shared unchanged blocks.** Copy-on-write cloning gives each worktree its own output. Writing in one worktree leaves the other worktrees independent.
2. **Exact source dates.** Only identical tracked files receive the original timestamps, preserving nanosecond precision so Cargo can recognize unchanged sources.
3. **Relocated build-script records.** Recorded checkout paths are updated for the new worktree, with record dates preserved.
4. **Your repository's commands.** Cargo runs from the configured package directories, with the features and profiles your repository actually uses.

The technique comes from [Heidrun Code](https://github.com/heidrun-org/heidrun_code/tree/main/packages/dev_tools/worktree_tools). Faster Rust Work Trees extracts the reusable mechanism into a pnpm monorepo with a shared TypeScript tool, a portable skill, and real Git and Cargo tests.

## Keep build output under control

Preview old worktree build folders:

```bash
npx --yes github:jeromeetienne/faster-rust-worktrees clean --days 14
```

Preview obsolete Cargo output using the configured build commands:

```bash
npx --yes github:jeromeetienne/faster-rust-worktrees prune
```

Both commands preview paths by default. Add `--apply` to remove the selected output, with builds stopped. Unknown output is retained; failed commands or unrecognized Cargo logs prevent pruning.

## Current support

- **macOS:** tested with real cloning, Cargo builds, source changes, concurrent worktrees, and cleanup.
- **Linux:** GNU `cp --reflink=always` support is implemented; live evaluation on a suitable file system is still pending.
- **Requirements:** Node.js 20.11 or later, Git, Rust, Cargo, Python 3, and a file system supporting copy-on-write cloning.
- **Skill status: Draft.** Independent-project measurements are available; unattended skill adoption remains unevaluated.

Keep Cargo output inside each checkout and unset `CARGO_TARGET_DIR`. Generated files outside Cargo output and paths embedded in compiled programs may need repository-specific setup. See [configuration and limits](skills/faster_rust_worktrees/references/setup.md).

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
packages/worktree_tools/       shared tool and real Cargo tests
skills/faster_rust_worktrees/  canonical skill and configuration reference
docs/                         measurements, raw evidence, and reproduction methods
```

[MIT license](LICENSE) · [Source attribution](NOTICE.md)

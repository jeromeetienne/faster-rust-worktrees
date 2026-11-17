# Faster Rust Work Trees

**Build once. Let your coding agent start the next worktree faster.**

A new Rust worktree usually starts with an empty build folder. Faster Rust Work Trees reuses the build you already have, giving each worktree independent Cargo output while sharing unchanged disk blocks.

**Ten built late-sh release worktrees: 34.98 GB of added space becomes 846 MB.**

Use the [faster_rust_worktrees skill](skills/faster_rust_worktrees/SKILL.md) with your coding agent. The skill guides repository setup, verifies build reuse, and integrates Faster Rust Work Trees into the repository’s worktree workflow.

## Use the skill with your coding agent

### 1. Install the skill

From your Rust repository, install the skill using [skills.sh](https://skills.sh/docs):

```bash
npx skills add jeromeetienne/faster-rust-worktrees --skill faster_rust_worktrees
```

Select your coding agent when prompted. The skill is installed for the current project, including its referenced files.

### 2. Configure the repository once

With the skill available, ask:

> Use faster_rust_worktrees to configure this Rust repository. Verify that unchanged builds reuse Cargo output and that source changes still build and test correctly. Integrate Faster Rust Work Trees into this repository’s worktree workflow.

The coding agent finds the actual build and test commands, prepares the main checkout’s output, and checks copy-on-write cloning on your file system. Verification includes changed-source behaviour and independent concurrent builds. After verification, the coding agent updates the repository’s worktree instructions for future tasks.

Repository-specific configuration stays in your repository. The shared implementation stays here.

### 3. Request coding tasks as usual

> Fix this issue in a new worktree, using the repository’s configured Faster Rust Work Trees workflow. Run the relevant tests and prepare the changes for review.

The coding agent creates the worktree, reuses existing build output, makes the changes, and runs the tests. You review the result. Changed code still needs compilation; unchanged dependencies are where repeated work can be avoided.

## The difference, measured

Creating worktrees **and completing their first builds**, with the main checkout already built. Ten-worktree time is the total for ten sequential creations and builds:

| Project | Worktrees | Build profile | Ordinary | Optimized | Less waiting |
|---|---:|---|---:|---:|---:|
| late-sh | 1 | Release | 128.132 seconds | **5.852 seconds** | **95.4%** |
| late-sh | 10 | Release | 1319.335 seconds | **54.450 seconds** | **95.9%** |
| ripgrep | 1 | Debug | 6.979 seconds | **0.606 seconds** | **91.3%** |
| fd | 1 | Debug | 6.207 seconds | **0.546 seconds** | **91.2%** |

Added allocated space **after building every worktree**:

| Project | Worktrees | Ordinary | Optimized | Space reduction |
|---|---:|---:|---:|---:|
| late-sh | 1 | 3,512 MB | **84.4 MB** | **97.6%** |
| late-sh | 10 | 34,983 MB | **846.0 MB** | **97.6%** |
| ripgrep | 1 | 294 MB | **5.0 MB** | **98.3%** |
| ripgrep | 10 | 2,942 MB | **50.1 MB** | **98.3%** |
| fd | 1 | 161 MB | **1.3 MB** | **99.2%** |
| fd | 10 | 1,613 MB | **12.8 MB** | **99.2%** |

One-worktree comparisons and the earlier ripgrep and fd ten-worktree space comparisons were repeated three times; those rows show medians. The late-sh ten-worktree rows show one completed run per case. All optimized first builds compiled **zero crates**. Ten-worktree space was measured with ten built worktrees present together, rather than estimated from one worktree.

Measured on macOS with unchanged sources: the documented `cargo build --release --bin late` build for late-sh, and debug builds for ripgrep and fd. Each project's ordinary and optimized builds use identical settings; absolute build times across projects also reflect the different profiles. Space excludes the built main checkout and common Cargo caches; MB means 1,000,000 bytes. Allocated space was measured inside an isolated Apple File System volume, counting shared blocks once. Source changes and other environments can change the savings.

### A larger application: late-sh

[late-sh](https://github.com/mpiorowski/late-sh) provides a terminal application, a Secure Shell service, and web services. Its release build gives an example from a larger Rust application alongside the smaller command-line tools ripgrep and fd. An ordinary worktree compiled 466 crates; an optimized worktree compiled zero.

| Project | Rust code lines | Rust files |
|---|---:|---:|
| late-sh | 579,109 | 1,794 |
| ripgrep | 37,752 | 102 |
| fd | 7,179 | 25 |

Counts use the source line counter cloc 2.06 on tracked Rust files at the measured revisions, excluding blank lines, comments, and vendored code. Tests, examples, and all workspace members are included; these are repository source counts, not counts of only the code compiled into the measured binary. See the [late-sh measurements and source-count method](docs/evaluation/late_sh_measurements.md).

Read the [timing results and commands](https://github.com/jeromeetienne/faster-rust-worktrees/issues/3#issuecomment-6919366785), [space results and measurement method](https://github.com/jeromeetienne/faster-rust-worktrees/issues/3#issuecomment-6919213926), or the [full evaluation](docs/evaluation/evaluation.md).

## 126×: disk lifetime and the daily cost of rebuilding

**Estimate: 20 pull requests a day, one new worktree per pull request, and 5 GB of additional build output per worktree.**

Applying the measured allocation reduction of approximately 126-fold:

| Daily build allocation | Ordinary worktrees | Optimized worktrees, estimated |
|---|---:|---:|
| 20 worktrees × 5 GB | 100 GB | **0.79 GB** |

**That is approximately 99.2 GB of avoided new build allocation every day.** The calculation is `20 × 5 GB − (20 × 5 GB / 126)`. The 5 GB size and 20-worktree day are illustrative inputs; the 126-fold allocation factor comes from the fd benchmark. This estimates allocation across the day's worktree creations, rather than peak occupied space.

**You can delete a build folder. You cannot undo flash wear.**

A solid-state drive (SSD) has finite write endurance. Its flash memory can withstand a limited number of write-and-erase cycles. Rebuilding unchanged dependencies repeatedly creates avoidable write activity, even when plenty of disk space is free. Drive manufacturers describe endurance in terms of how much data can be written over the drive's life; [Kingston explains the limits and the role of write activity](https://www.kingston.com/unitedkingdom/en/ssd/ssd-faq).

Faster Rust Work Trees shares existing build blocks and reuses compiled dependencies. Each optimized worktree in our tests completed its unchanged first build with **zero crates compiled**. That avoids regenerating the same dependency artifacts and is expected to reduce unnecessary writes as worktrees are created repeatedly. The benefit matters even when the disk has room to spare, and becomes particularly relevant for Cargo build folders reaching tens of gigabytes.

For ten late-sh release worktrees, measured added allocation fell from **34.98 GB to 846 MB**—about **1/41.4 of ordinary allocation**. Ten ripgrep worktrees used about **1/59** of ordinary added allocation; ten fd worktrees fell from **1,613 MB to 12.8 MB**, about **1/126**. The 126-fold estimate above uses fd's result; late-sh's measured factor is smaller.

**An estimated 126-fold increase in lifetime before flash wears out, under the stated assumptions.** If the 126-fold allocation reduction corresponds to 126-fold fewer wear-causing writes, and other wear-causing writes are negligible, the lifetime before flash wears out would be approximately **126 times as long** at the same operation frequency. Under that model, the daily example also estimates **99.2 GB of avoided wear-causing writes**. The directly measured result is allocation reduction; the daily write and lifetime figures are assumption-based estimates.

## Current support

- **macOS:** tested with real cloning, Cargo builds, source changes, concurrent worktrees, and cleanup.
- **Linux:** cloning support is implemented; live evaluation on a suitable file system is still pending.
- **Skill status: Draft.** Independent-project measurements are available; unattended skill adoption remains unevaluated. The first setup includes verification in your actual repository.

The coding agent follows the skill’s [configuration and limits](skills/faster_rust_worktrees/references/setup.md) to check requirements and handle repository-specific setup.

## Direct tool use and development

For manual installation, configuration, worktree creation, cleanup, implementation details, and development commands, read the [faster_rust_worktrees package README](packages/faster_rust_worktrees/README.md).

[MIT license](LICENSE) · [Source attribution](NOTICE.md)

# Making Rust Development with AI Faster

- Created: 17 November 2026
- Last updated: 17 November 2026
- Status: Article draft for review before publication on dev.to
- Related framing: [Repository instructions](../../../AGENTS.md)
- Related rules: [Docs folder system](../../../.agents/skills/docs_folder_system/SKILL.md), [Folder constraints](../../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)
- Related issue: [Article planning](https://github.com/jeromeetienne/faster-rust-worktrees/issues/11)

*With AI, each coding task gets its own worktree. Here’s how to create and build those worktrees more than 10 times faster.*

## Parallel coding agents multiply the same Rust build cost

One coding agent fixes a bug. Another adds a feature. A third updates tests. Each coding task gets a branch, an independent working directory, and its own build output. After review, the changes are merged.

This is the [feature](https://docs.github.com/en/get-started/using-github/github-flow) [branch](https://about.gitlab.com/topics/version-control/what-is-gitlab-flow/) [workflow](https://nvie.com/posts/a-successful-git-branching-model/), extended with Git worktrees so several branches can be checked out at once. Each coding agent can modify files and build an executable without another coding agent changing the files underneath the build.

But creating a fresh Rust worktree usually means starting with an empty Cargo build folder. The dependencies are already compiled in the main checkout, yet the new worktree compiles those dependencies again. Repeat the process across coding tasks and the cost grows quickly.

Three parallel coding tasks are enough to make the cost noticeable. For late-sh, scaling the benchmark to three worktrees and their first release builds gives **6 minutes 36 seconds ordinarily, compared with 16 seconds using Faster Rust Work Trees**: approximately **24 times faster**. Additional allocated space falls from **10.5 GB to 254 MB**.

The benchmark used an already-built main checkout and unchanged sources on macOS, excluding the initial build. The times represent the sum of sequential creation and first-build times, rather than the elapsed time for three concurrent builds. The opportunity is to reuse work already completed before another coding agent starts.

## Reuse an existing build while keeping worktrees independent

[Faster Rust Work Trees](https://github.com/jeromeetienne/faster-rust-worktrees) gives each new worktree a copy of the main checkout’s Cargo output using **copy-on-write cloning**.

Copy-on-write means separate files can initially refer to the same physical disk blocks. When a worktree changes data, the file system allocates separate blocks for the changed data. The other worktrees retain their original contents.

Each worktree therefore has an independent build folder. Compilation in one worktree can replace files without replacing another worktree’s files. The unchanged blocks remain shared.

This matters for parallel builds. Pointing every coding agent at one common build folder introduces shared mutable output and potential contention. Independent cloned folders preserve separate build state while avoiding full physical copies of existing output.

There are two benefits, with different causes. Sharing blocks reduces additional disk allocation. Making existing output reusable by Cargo avoids compilation. Cloning provides the starting point; Cargo still needs to recognise that the build is current.

The mechanism originated in [Heidrun Code](https://github.com/heidrun-org/heidrun_code/tree/main/packages/dev_tools/worktree_tools). Faster Rust Work Trees makes the mechanism available as a reusable tool with repository-specific configuration.

## Why cloning the build folder alone does not work

A new checkout changes more than the location of the source code. Fresh file timestamps and recorded paths can make an otherwise identical build appear outdated.

### Preserve exact dates for unchanged sources

Git writes the worktree’s source files during checkout. Those files receive new modification timestamps, even when their contents match the original checkout.

Cargo uses timestamps as part of determining whether output needs rebuilding. A source file dated after the existing build can trigger compilation despite containing identical bytes.

Faster Rust Work Trees compares tracked files with the main checkout. Only regular files with identical contents receive the original timestamps. Changed files retain their new dates so Cargo can rebuild. Matching source directories also receive their original dates where appropriate.

Precision matters. During evaluation, restoring dates through JavaScript lost nanosecond precision and ripgrep still compiled one crate. The implementation now uses Python’s nanosecond timestamp operations. After the correction, the measured unchanged optimized builds compiled zero crates.

### Relocate build-script records

Cargo build scripts can record absolute paths, including paths watched for changes. Cargo saves build-script output in files inside the build folder, as described in the [Cargo build-script documentation](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

A cloned record may still point into the main checkout. Faster Rust Work Trees replaces original-checkout prefixes in those output records with the new worktree’s path, then restores the records’ exact timestamps.

This relocation targets build-script records. Arbitrary paths embedded inside compiled programs or generated files can still require repository-specific handling.

### Keep the build settings consistent

Reusing a debug build does not supply a missing release build. Different features, compiler versions, targets, environment settings, or commands can require new compilation.

Build the main checkout using the commands the new worktrees will actually run. Keep Cargo output inside each checkout and leave `CARGO_TARGET_DIR` unset. Stop builds before cloning: a build folder being modified is not a consistent snapshot.

## Follow one coding task from worktree creation to tested change

For a simple Rust repository that builds and tests from its root, create `faster-rust-worktrees.json` in the main checkout:

```json
{
  "baseRef": "HEAD",
  "worktreeDirectory": ".agents/worktree",
  "targetDirectories": ["target"],
  "cargoCommands": [
    { "cwd": ".", "argv": ["cargo", "build", "--locked"] },
    { "cwd": ".", "argv": ["cargo", "test", "--locked", "--no-run"] }
  ]
}
```

Adapt the working directories and arguments to the repository. Add `/.agents/worktree/` to the repository’s ignore rules. Commit the configuration, ignore rule, and existing lockfile before preparing the main checkout’s build output.

From the main checkout, build the executable and test executables:

```bash
cargo build --locked
cargo test --locked --no-run
```

Create the task’s branch and worktree:

```bash
npx --yes github:jeromeetienne/faster-rust-worktrees create fix-example
```

The command reports whether the configured build folder was cloned. Missing output or unavailable copy-on-write support is reported explicitly; check that report before assuming reuse happened.

Enter the worktree and run the normal commands:

```bash
cd .agents/worktree/fix-example
cargo build --locked
cargo test --locked
```

The `create` command prepares reusable output; the subsequent Cargo commands build and test the worktree. After the coding agent changes source code, run those commands again. Cargo should compile the affected code and reuse output that remains current.

The real integration test exercises this distinction with an application, a shared dependency, and a build script watching an absolute source path. Its unchanged first build produced:

```text
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.00s
```

The test then changes the dependency in one worktree and runs two builds concurrently. The changed program prints `43`; the other worktree and original executable still print `42`. These checks verify actual behaviour, beyond a successful unchanged build.

## The numbers for three worktrees

Creation plus first-build time for three worktrees, with unchanged sources and a main checkout already built with matching settings:

| Project | Worktrees | Profile | Ordinary | Optimized |
|---|---:|---|---:|---:|
| late-sh | 3 | Release | 396 s | 16.3 s |
| ripgrep | 3 | Debug | 20.9 s | 1.82 s |
| fd | 3 | Debug | 18.6 s | 1.64 s |

Additional allocated space with three built worktrees retained together:

| Project | Ordinary | Optimized | Reduction |
|---|---:|---:|---:|
| late-sh | 10.5 GB | 254 MB | 97.6% |
| ripgrep | 883 MB | 15.0 MB | 98.3% |
| fd | 484 MB | 3.84 MB | 99.2% |

The tables scale the recorded results to three worktrees: three tenths of the ten-worktree measurements for late-sh timing and all storage figures, and three times the one-worktree timing medians for ripgrep and fd.

The source one-worktree comparisons and ripgrep and fd storage comparisons were repeated three times. The late-sh ten-worktree comparison is one complete paired run. All measured optimized unchanged first builds compiled zero crates.

These times are combined sequential creation-plus-build times. Three agents can work concurrently after setup; the totals describe sequential setup and builds. Creation alone can take longer because cloning and preparing output costs time. Source changes still require compilation, and the initial main-checkout build remains necessary.

The source storage measurements used an isolated Apple File System volume, counting shared blocks once and retaining all measured worktrees together. The figures exclude the already-built main checkout and common Cargo caches. Summing apparent folder sizes would misrepresent the benefit of shared blocks.

Avoiding repeated compilation also avoids regenerating the same output. That matters for drive lifetime because flash storage has finite write endurance. However, these tests measured allocated space, not physical writes or drive wear; the allocation reductions do not establish an equivalent lifetime increase.

The [late-sh measurements](https://github.com/jeromeetienne/faster-rust-worktrees/blob/main/docs/late_sh_measurements.md), [timing evaluation](https://github.com/jeromeetienne/faster-rust-worktrees/blob/main/docs/evaluation.md), and [storage measurements](https://github.com/jeromeetienne/faster-rust-worktrees/blob/main/docs/space_measurements.md) include conditions, raw evidence, and reproduction methods.

## Try Faster Rust Work Trees in your repository

Start with:

```bash
npx --yes github:jeromeetienne/faster-rust-worktrees --help
```

Requirements are Node.js 20.11 or later, Git, Rust, Cargo, Python 3, and a file system supporting copy-on-write cloning. macOS has live verification; Linux cloning support is implemented but evaluation on a suitable Linux file system remains pending.

The [faster_rust_worktrees skill](https://github.com/jeromeetienne/faster-rust-worktrees/tree/main/skills/faster_rust_worktrees) helps a coding agent find repository-specific commands, configure the tool, and verify reuse and changed behaviour. The skill remains Draft while unattended adoption is unevaluated.

Use the [setup reference](https://github.com/jeromeetienne/faster-rust-worktrees/blob/main/skills/faster_rust_worktrees/references/setup.md) for configuration and cleanup. Cleanup previews candidates before removal; stop builds before applying removal. For repeatable automation, pin an available reviewed Git reference in the package URL.

Give the next coding task an independent worktree with the build output you already paid to produce.

# Making Rust Development with AI Faster

- Created: 17 November 2026
- Last updated: 17 November 2026
- Status: Article draft for review before publication on dev.to
- Related framing: [Repository instructions](../../../AGENTS.md)
- Related rules: [Docs folder system](../../../.agents/skills/docs_folder_system/SKILL.md), [Folder constraints](../../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)
- Related issue: [Article planning](https://github.com/jeromeetienne/faster-rust-worktrees/issues/11)

*With AI, each coding task gets its own worktree. Here’s how to create and build those worktrees more than 10 times faster.*

## Parallel coding agents multiply the same Rust build cost

When I run three coding tasks at once, I give each coding agent a branch and a worktree. One coding agent can fix a bug while another adds a feature and a third updates tests. Each coding agent builds and tests independently. I review the changes before merging.

This is the [feature](https://docs.github.com/en/get-started/using-github/github-flow) [branch](https://about.gitlab.com/topics/version-control/what-is-gitlab-flow/) [workflow](https://nvie.com/posts/a-successful-git-branching-model/), extended with Git worktrees so several branches can be checked out at once. Each coding agent can modify files and build an executable without another coding agent changing the files underneath the build.

The annoying part comes before the coding agent has changed anything. A fresh Rust worktree usually has an empty Cargo build folder. The dependencies are already compiled in the main checkout, but the coding agent has to compile the same dependencies again. And again for the next task.

Three parallel coding tasks are enough to make the cost noticeable. For late-sh, scaling the benchmark to three worktrees and their first release builds gives **6 minutes 36 seconds ordinarily, compared with 16 seconds using Faster Rust Work Trees**: approximately **24 times faster**. Additional allocated space falls from **10.5 GB to 254 MB**.

The benchmark starts with an already-built main checkout and unchanged sources on macOS. The initial build is excluded. These are summed creation and first-build times; I’ll explain the calculation below.

## Reuse an existing build while keeping worktrees independent

[Faster Rust Work Trees](https://github.com/jeromeetienne/faster-rust-worktrees) gives each new worktree a copy of the main checkout’s Cargo output using **copy-on-write cloning**.

Each worktree has its own files, but the file system initially stores the unchanged contents in shared disk blocks. When a worktree writes new data, the file system allocates separate blocks for the changes. The other worktrees keep their original contents.

So a coding agent can replace build output without replacing another coding agent’s build output. Unchanged blocks stay shared.

I want builds to stay independent. Pointing every coding agent at one common build folder means the coding agents write to the same output and can wait on each other. Cloning gives each worktree a separate build folder without making a full physical copy.

The shared blocks save disk space. Reusing compiled output saves build time. But cloning alone doesn’t make Cargo accept the existing build.

The mechanism originated in [Heidrun Code](https://github.com/heidrun-org/heidrun_code/tree/main/packages/dev_tools/worktree_tools). Faster Rust Work Trees makes the mechanism available as a reusable tool with repository-specific configuration.

## Why cloning the build folder alone does not work

Copy the build folder, run Cargo, and you can still get recompilation. The files may be identical, but their timestamps are new and some recorded paths still point to the original checkout.

### Preserve exact dates for unchanged sources

Git writes the source files when creating a worktree, giving the source files new modification timestamps. Cargo checks timestamps when deciding whether to rebuild. A source file that looks newer than the existing build can trigger compilation even when the contents haven’t changed.

Faster Rust Work Trees compares tracked files with the main checkout. Only regular files with identical contents receive the original timestamps. Changed files retain their new dates so Cargo can rebuild. Matching source directories also receive their original dates where appropriate.

This took more care than just copying dates. In the first ripgrep evaluation, restoring timestamps through JavaScript lost nanosecond precision. One crate still compiled. The implementation now uses Python’s nanosecond timestamp operations, and the measured unchanged optimized builds compiled zero crates.

### Relocate build-script records

Cargo build scripts can record absolute paths, including paths watched for changes. Cargo saves build-script output in files inside the build folder, as described in the [Cargo build-script documentation](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

A cloned record may still point into the main checkout. Faster Rust Work Trees replaces original-checkout prefixes in those output records with the new worktree’s path, then restores the records’ exact timestamps.

That fixes the build-script records. Paths embedded inside compiled programs or generated files may still need handling specific to the repository.

### Keep the build settings consistent

A debug build won’t supply a missing release build. Changing features, compiler versions, targets, environment settings, or commands can also require compilation.

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

Check the creation report. The command tells you whether the build folder was cloned, whether the original output was missing, or whether copy-on-write cloning was unavailable.

Enter the worktree and run the normal commands:

```bash
cd .agents/worktree/fix-example
cargo build --locked
cargo test --locked
```

The `create` command prepares the worktree. You still run Cargo to build and test. After the coding agent changes source code, run the same commands again: Cargo should compile the affected code and reuse the output that remains current.

I also want to check what happens after a source change. The integration test uses a real Cargo workspace with an application, a shared dependency, and a build script watching an absolute source path. The unchanged first build produced:

```text
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.00s
```

Then the test changes the dependency in one worktree and runs two builds concurrently. The changed program prints `43`. The other worktree and the original executable still print `42`. The changed code runs, and the other builds remain independent.

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

These totals add up sequential creation and first builds. They don’t measure three simultaneous builds. Creating an optimized worktree can actually take longer because cloning and preparing output costs time. The saving comes when Cargo reuses the output. You still pay for the initial main-checkout build and for compiling later source changes.

The source storage measurements used an isolated Apple File System volume, counting shared blocks once and retaining all measured worktrees together. The figures exclude the already-built main checkout and common Cargo caches. Summing apparent folder sizes would misrepresent the benefit of shared blocks.

Drive lifetime matters to me too. Deleting a build folder frees space, but doesn’t undo the writes used to produce the build. Reusing compiled output avoids generating the same files again. The measurements here cover allocation, though: they don’t measure physical writes or establish how much longer a drive would last.

The [late-sh measurements](https://github.com/jeromeetienne/faster-rust-worktrees/blob/main/docs/late_sh_measurements.md), [timing evaluation](https://github.com/jeromeetienne/faster-rust-worktrees/blob/main/docs/evaluation.md), and [storage measurements](https://github.com/jeromeetienne/faster-rust-worktrees/blob/main/docs/space_measurements.md) include conditions, raw evidence, and reproduction methods.

## Try Faster Rust Work Trees in your repository

Start with:

```bash
npx --yes github:jeromeetienne/faster-rust-worktrees --help
```

Requirements are Node.js 20.11 or later, Git, Rust, Cargo, Python 3, and a file system supporting copy-on-write cloning. macOS has live verification; Linux cloning support is implemented but evaluation on a suitable Linux file system remains pending.

The [faster_rust_worktrees skill](https://github.com/jeromeetienne/faster-rust-worktrees/tree/main/skills/faster_rust_worktrees) helps a coding agent find repository-specific commands, configure the tool, and verify reuse and changed behaviour. The skill remains Draft while unattended adoption is unevaluated.

Use the [setup reference](https://github.com/jeromeetienne/faster-rust-worktrees/blob/main/skills/faster_rust_worktrees/references/setup.md) for configuration and cleanup. Cleanup previews candidates before removal; stop builds before applying removal. For repeatable automation, pin an available reviewed Git reference in the package URL.

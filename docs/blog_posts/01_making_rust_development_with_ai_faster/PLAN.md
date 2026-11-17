# Writing plan: Making Rust Development with AI Faster

- Created: 17 November 2026
- Last updated: 17 November 2026
- Status: Proposed article plan for discussion
- Related framing: [Repository instructions](../../../AGENTS.md)
- Related rules: [Docs folder system](../../../.agents/skills/docs_folder_system/SKILL.md), [Folder constraints](../../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)
- Related issue: [Article planning](https://github.com/jeromeetienne/faster-rust-worktrees/issues/11)

## Editorial direction

Use the agreed title and subtitle in [README.md](README.md). Write for developers using coding agents on Rust projects, introducing unfamiliar terms in plain words. Move from parallel coding tasks to repeated build costs, then explain the mechanism, demonstrate correctness, and present the measurements.

## 1. Parallel coding agents multiply the same Rust build cost

Explain the feature branch workflow: each coding task gets a branch and a worktree, allowing coding agents to work independently.
Show how fresh worktrees repeatedly compile the same dependencies, adding waiting time and disk allocation as the number of tasks grows.
Introduce a three-task example using late-sh: creation plus first builds of approximately 6 minutes 36 seconds ordinarily, compared with 16 seconds optimized. Scale the recorded ten-worktree results by three tenths and explain the calculation once beside the tables.
State early that the comparison starts with an already-built main checkout and unchanged sources on macOS.

## 2. Reuse an existing build while keeping worktrees independent

Explain how copy-on-write cloning gives each worktree an independent build folder while sharing unchanged disk blocks.
Use a diagram to show the built main checkout, the new worktrees, and the separate storage allocated when a worktree changes data.
Distinguish sharing disk blocks from making several agents write into the same build folder.
Explain that block sharing saves allocation, while Cargo recognising reusable output avoids compilation.

## 3. Why cloning the build folder alone does not work

Explain how Cargo decides whether existing build output can be reused, using concrete examples of checks that cause recompilation.
Show why source timestamps, recorded checkout paths, and matching commands, features, profiles, and working directories matter.
Describe how Faster Rust Work Trees preserves exact timestamps for identical tracked files and adjusts build-script records while preserving their timestamps.
Connect each implementation step to the specific reuse problem the implementation step solves.

## 4. Follow one coding task from worktree creation to tested change

Walk through configuring a real Rust repository and building the main checkout with the commands the worktrees will use.
Create an optimized worktree, run the unchanged first build, and show the observed reuse using actual command output.
Then modify source code, rebuild, and run tests to demonstrate that necessary compilation still happens and the main checkout remains independent.
Explain the reusable tool and how the faster_rust_worktrees skill helps a coding agent configure repository-specific commands.

## 5. What the measurements demonstrate

Compare ordinary and optimized worktrees using the published late-sh, ripgrep, and fd results, keeping each comparison’s build settings explicit.
Present three-worktree creation plus first-build time and additional allocated disk space separately; state the linear extrapolation method and explain how shared disk blocks were counted in the source measurements.
State which source results are repeated measurements and which are single runs, distinguish unchanged first builds from builds after source changes, and explain that summed sequential build times do not measure concurrent build elapsed time.
Keep measured allocation separate from estimates about writes or drive lifetime; explain that creation alone can take longer even when creation plus building is much faster.

## 6. Try Faster Rust Work Trees in your repository

Give the requirements and the command readers can use to get started, linking to the repository’s configuration instructions.
Explain how the faster_rust_worktrees skill helps coding agents identify the actual build commands and verify reuse in the receiving repository.
State tested macOS support and pending Linux evaluation, with relevant file-system requirements and repository-specific limits.
Link to cleanup instructions and explain that builds must be stopped while cloning or applying cleanup.

## Visuals

- **Social media card and article cover:** Use the agreed title and subtitle with a comparison of repeated ordinary builds and independent build folders sharing unchanged disk blocks. Keep any measured number tied to its project and test conditions.
- **Technical diagram for section 2:** Show the built main checkout, two new worktrees, shared unchanged disk blocks, and separate blocks after a change. Make the independence of the build folders clear.
- **Results for section 5:** Use compact tables for build time and additional allocated disk space, with measurement conditions nearby.

## Evidence and preparation

- [Repository overview](../../../README.md): Current commands, mechanism, support, and configuration entry points.
- [late-sh measurements](../../late_sh_measurements.md): The lead comparison, environment, raw evidence, and measurement method.
- [Evaluation](../../evaluation.md): Correctness checks and supporting ripgrep and fd timing evidence.
- [Space measurements](../../space_measurements.md): Allocated-space evidence and the method for counting shared blocks.
- [Setup reference](../../../skills/faster_rust_worktrees/references/setup.md): Receiving-repository configuration and limits.

Before drafting technical examples, check the implementation against the explanation. Run the selected walkthrough in a representative real repository and retain the command output used in the article. Review the article draft and social media card before publication on dev.to.

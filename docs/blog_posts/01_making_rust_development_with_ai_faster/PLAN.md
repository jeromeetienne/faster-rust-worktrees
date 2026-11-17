# Writing plan: Making Rust Development with AI Faster

- Created: 17 November 2026
- Last updated: 17 November 2026
- Status: Proposed article plan for discussion
- Related framing: [Repository instructions](../../../AGENTS.md)
- Related rules: [Docs folder system](../../../.agents/skills/docs_folder_system/SKILL.md), [Folder constraints](../../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)
- Related issue: [Article planning](https://github.com/jeromeetienne/faster_rust_worktrees/issues/11)

## Editorial direction

Use the agreed title and subtitle in [README.md](README.md). Write for developers using coding agents on Rust projects, introducing unfamiliar terms in plain words. Move from parallel coding tasks to repeated build costs, then explain the mechanism, present the measurements, and finish with the skill-based workflow. Keep manual configuration and command-line details in the repository documentation.

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

## 4. What the measurements demonstrate

Compare ordinary and optimized worktrees using the published late-sh, ripgrep, and fd results, keeping each comparison’s build settings explicit.
Present three-worktree creation plus first-build time and additional allocated disk space separately; state the linear extrapolation method and explain how shared disk blocks were counted in the source measurements.
State which source results are repeated measurements and which are single runs, distinguish unchanged first builds from builds after source changes, and explain that summed sequential build times do not measure concurrent build elapsed time.
Keep measured allocation separate from estimates about writes or drive lifetime; explain that creation alone can take longer even when creation plus building is much faster.

## 5. Use the skill with your coding agent

Explain that the reader installs faster_rust_worktrees and asks the coding agent to configure the repository, with installation details linked to the repository.
Give a short setup prompt and a normal issue-fix prompt, rather than manual configuration files or shell commands.
Describe how the coding agent verifies reuse and changed-source correctness, then integrates the configured workflow into repository instructions.
State macOS support, pending Linux evaluation, and draft skill status; link to detailed requirements and cleanup instructions.

## Visuals

- **Social media card and article cover:** Use the agreed title and subtitle with a comparison of repeated ordinary builds and independent build folders sharing unchanged disk blocks. Keep any measured number tied to its project and test conditions.
- **Technical diagram for section 2:** Show the built main checkout, two new worktrees, shared unchanged disk blocks, and separate blocks after a change. Make the independence of the build folders clear.
- **Results for section 4:** Use separate horizontal bar charts for build time and additional allocation, normalizing each project’s ordinary case to 100% and labelling absolute totals, speed multipliers, and time or space saved.

## Evidence and preparation

- [Repository overview](../../../README.md): Current commands, mechanism, support, and configuration entry points.
- [late-sh measurements](../../evaluation/late_sh_measurements.md): The lead comparison, environment, raw evidence, and measurement method.
- [Evaluation](../../evaluation/evaluation.md): Correctness checks and supporting ripgrep and fd timing evidence.
- [Space measurements](../../evaluation/space_measurements.md): Allocated-space evidence and the method for counting shared blocks.
- [Setup reference](../../../skills/faster_rust_worktrees/references/setup.md): Receiving-repository configuration and limits.

Check the implementation and skill instructions against the explanation. Keep the real Cargo verification evidence available through the linked evaluation records. The article’s practical examples are prompts to the coding agent, with manual commands left in the repository documentation. Review the article draft and social media card before publication on dev.to.

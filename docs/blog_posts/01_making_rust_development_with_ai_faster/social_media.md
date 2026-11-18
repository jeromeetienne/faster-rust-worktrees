# Social media: Making Rust Development with AI Faster

- Created: 17 November 2026
- Last updated: 17 November 2026
- Status: Six proposed posts and sharing advice for review
- Related framing: [Article overview](README.md), [Article draft](ARTICLE.md)
- Related rules: [Docs folder system](../../../.agents/skills/docs_folder_system/SKILL.md), [Folder constraints](../../../.agents/rules_of_the_repo/config/repo_folders_constraints/config.md)
- Related issue: [Article planning](https://github.com/jeromeetienne/faster_rust_worktrees/issues/11)

## How to use these posts

Publish the dev.to article before sharing the article link. At the last API verification on 17 November 2026, the article remained unpublished. The posts below are drafts; no social media posts have been sent or scheduled.

Use [image-main-v6.png](image-main-v6.png) for the first announcement. For later posts, use the relevant [build-time chart](image-build-time.png) or [allocation chart](image-disk-space.png), or share the text without an attachment. Keep the estimated nature and measurement conditions visible when sharing performance figures.

You can share the same article six times by changing the subject of each post: the workflow, the measured result, storage, the implementation detail, the full explanation, and a discussion question. Space the posts over several weeks rather than sending all six together. The sequence below is a starting suggestion, not a measured best schedule. Adjust the sequence based on replies and interest.

| Post | Suggested timing | Subject | Suggested illustration |
|---|---|---|---|
| 1 | Publication day | Coding agents and repeated builds | V6 |
| 2 | About three days later | Creation and first-build time | Build-time chart |
| 3 | About one week after publication | Added allocation | Allocation chart |
| 4 | About ten days after publication | Timestamp precision | Text only |
| 5 | About two weeks after publication | Full explanation | V6 |
| 6 | About three weeks after publication | Ask other Rust developers | Text only |

Tomorrow morning is a reasonable time to start if the article is ready and you can answer comments. For later posts, try a weekday around 16:00 Paris time to overlap European afternoons and North American mornings. This is a practical starting suggestion, not a proven dev.to optimum; do not delay a ready article solely for the publishing hour. Dev.to supports [scheduled publication in your local time zone](https://dev.to/help/writing-editing-scheduling).

The longer drafts suit LinkedIn or another service allowing longer posts. For a service with a shorter limit, split a draft into a short series or shorten the draft while keeping the relevant measurement conditions. These drafts have not been checked against each service's character limit.

## Post 1: Coding agents and repeated builds

Running several coding agents on Rust projects?

Separate worktrees keep their changes independent. But each fresh worktree can rebuild dependencies you already compiled.

I wrote about reusing those builds while keeping each worktree’s Cargo output independent.

https://dev.to/jeromeetienne/making-rust-development-with-ai-faster-23p6

## Post 2: The measured result

Three Rust worktrees. The same dependencies compiled three times.

For late-sh, estimated creation + first release-build time falls from 6 min 36 s to 16.3 s by reusing existing Cargo output.

These estimates scale the recorded measurements on macOS, with unchanged sources and an already-built main checkout. Every measured unchanged optimized first build compiled zero crates.

Changed code still needs compilation. The saving comes from reusing unchanged compiled output.

https://dev.to/jeromeetienne/making-rust-development-with-ai-faster-23p6

## Post 3: Added allocation

Separate Rust worktrees do not need separate copies of every compiled dependency on disk.

For three late-sh worktrees, estimated added allocation falls from 10.5 GB to 254 MB using Faster Rust Work Trees.

Each worktree keeps independent files while sharing unchanged disk blocks through copy-on-write cloning. Changes allocate separate blocks.

The figures are scaled from macOS measurements with unchanged sources and an already-built main checkout. Allocated storage was measured; drive wear was not.

Here’s the mechanism, the measurements, and the limits:

https://dev.to/jeromeetienne/making-rust-development-with-ai-faster-23p6

## Post 4: A technical detail

Copying Rust’s `target/` folder into a new worktree sounds straightforward.

Then fresh source timestamps and build-script records pointing at the original checkout can make Cargo rebuild anyway.

One detail in the evaluation: losing nanosecond timestamp precision was enough to trigger recompilation.

Here’s what making build reuse work actually required:

https://dev.to/jeromeetienne/making-rust-development-with-ai-faster-23p6

## Post 5: The full explanation

Using coding agents in parallel exposed a repeated cost in my Rust workflow.

Each task gets a branch and a worktree. The changes stay independent, but fresh worktrees repeatedly compile dependencies already built in the main checkout.

Faster Rust Work Trees reuses existing Cargo output through copy-on-write cloning. Each worktree keeps independent files while sharing unchanged disk blocks.

For late-sh, scaling the measurements to three worktrees gives:

- Creation + first release builds: 6 min 36 s → 16.3 s.
- Added allocated space: 10.5 GB → 254 MB.

These figures assume unchanged sources, matching build settings, and an already-built main checkout on macOS. Changed code still needs compilation.

I wrote up how the mechanism works, why simply copying the build folder is insufficient, and how to configure the workflow with a coding agent.

https://dev.to/jeromeetienne/making-rust-development-with-ai-faster-23p6

## Post 6: Invite discussion

How do you handle Cargo build output when several coding agents work in separate Rust worktrees?

I want independent builds for each task, without repeatedly compiling unchanged dependencies.

Faster Rust Work Trees addresses that by cloning existing build output, preserving exact timestamps for unchanged sources, and relocating Cargo build-script records.

The measured unchanged optimized first builds compiled zero crates. The article includes timing and storage results for late-sh, ripgrep, and fd, along with the conditions and limitations. Linux cloning support is implemented, but live Linux evaluation remains pending.

I’d be interested to hear how other Rust developers handle this workflow.

https://dev.to/jeromeetienne/making-rust-development-with-ai-faster-23p6

# Directory Context: `/`

## Purpose

Faster Rust Work Trees is a pnpm monorepo containing a reusable Rust worktree optimization tool and its canonical skill.

## Key Exports & Entry Points

- `packages/`: pnpm workspace packages; see its CONTEXT.md.
- `skills/faster_rust_worktrees/`: canonical draft skill and configuration reference.
- `docs/`: evaluation evidence and repository documentation.
- `pnpm dev --help`: local executable.
- `pnpm test`: disposable real Cargo integration verification.

## Rules

- Receiving repositories configure the tool instead of copying its implementation.
- Folder responsibilities follow [Repo Folders Constraints](.agents/rules_of_the_repo/config/repo_folders_constraints/config.md).
- Repository settings stay outside reusable skill folders.

## Background

- https://github.com/jeromeetienne/faster-rust-worktrees/issues/3

# Directory Context: `/packages/faster_rust_worktrees/src`

## Purpose

Configuration, worktree reuse, and conservative cleanup.

## Key Exports & Entry Points

- `index.ts`: public package interface.
- `cli_launcher.mjs`: installed command launcher that loads cli.ts through tsx.
- `repository/`: configuration, Git operations, and command execution; see its CONTEXT.md.
- `worktrees/`: worktree creation and cleanup; see its CONTEXT.md.
- `cargo_reuse/`: build-output cloning and file-date restoration; see its CONTEXT.md.
- Command: `pnpm dev --help`.

## Rules

- Source code never imports test fixtures or receiving-repository configuration.
- Follow the repository folder constraints and personal TypeScript style.

## Background

- https://github.com/jeromeetienne/faster_rust_worktrees/issues/3

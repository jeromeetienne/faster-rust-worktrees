# Directory Context: `/packages/faster_rust_worktrees/src`

## Purpose

Configuration, worktree reuse, and conservative cleanup.

## Key Exports & Entry Points

- index.ts: public package interface.
- Command: `pnpm dev --help`.

## Rules

- Source code never imports test fixtures or receiving-repository configuration.
- Follow the repository folder constraints and personal TypeScript style.

## Background

- https://github.com/jeromeetienne/faster-rust-worktrees/issues/3

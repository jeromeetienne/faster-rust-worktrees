# Directory Context: `/packages/worktree_tools`

## Purpose

Reusable Rust worktree optimization and cleanup.

## Key Exports & Entry Points

- src/: public tool interface.
- tests/: disposable integration fixtures.
- Command: `pnpm test`.

## Rules

- Source code never imports test fixtures or receiving-repository configuration.
- Follow the repository folder constraints and personal TypeScript style.

## Background

- https://github.com/jeromeetienne/faster-rust-worktrees/issues/3

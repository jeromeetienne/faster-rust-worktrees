# Directory Context: `/packages/faster_rust_worktrees`

## Purpose

Reusable Rust worktree optimization and cleanup.

Direct tool use and development are documented in [README.md](README.md); the [root README](../../README.md) explains skill-based use.

## Key Exports & Entry Points

- src/: public tool interface.
- tests/: disposable integration fixtures.
- Command: `pnpm test`.

## Rules

- Source code never imports test fixtures or receiving-repository configuration.
- Follow the repository folder constraints and personal TypeScript style.

## Background

- https://github.com/jeromeetienne/faster-rust-worktrees/issues/3

# Directory Context: `/packages/worktree_tools/tests`

## Purpose

Repeatable isolated Git and Cargo verification.

## Key Exports & Entry Points

- Command: `pnpm test`.

## Rules

- Source code never imports test fixtures or receiving-repository configuration.
- Follow the repository folder constraints and personal TypeScript style.

## Background

- https://github.com/jeromeetienne/faster-rust-worktrees/issues/3

# Directory Context: `/packages/faster_rust_worktrees/src/worktrees`

## Purpose

Worktree creation and conservative build-output cleanup.

## Key Exports & Entry Points

- `worktree_create.ts`: worktree creation with reusable Cargo output.
- `target_cleanup.ts`: preview-first cleanup.

## Rules

- Source code never imports tests or skill instructions.
- Import implementation modules directly; the package public interface remains in the parent index.ts.
- Follow the repository folder constraints and personal TypeScript style.

## Background

- See the parent [CONTEXT.md](../CONTEXT.md) for package responsibilities.

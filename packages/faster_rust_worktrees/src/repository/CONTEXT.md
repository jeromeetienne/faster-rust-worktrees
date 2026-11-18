# Directory Context: `/packages/faster_rust_worktrees/src/repository`

## Purpose

Repository configuration, Git operations, and command execution.

## Key Exports & Entry Points

- `configuration.ts`: validated repository configuration and grouped target validation.
- `process_command.ts`: configured command execution.
- `worktree_git.ts`: Git worktree operations.

## Rules

- Source code never imports tests or skill instructions.
- Import implementation modules directly; the package public interface remains in the parent index.ts.
- Follow the repository folder constraints and personal TypeScript style.

## Background

- See the parent [CONTEXT.md](../CONTEXT.md) for package responsibilities.

# Directory Context: `/packages/faster_rust_worktrees/src/cargo_reuse`

## Purpose

Cargo build-output cloning, build-script path relocation, and file-date restoration.

## Key Exports & Entry Points

- `directory_clone.ts`: independent directory cloning.
- `source_dates.ts`: unchanged source file date restoration.
- `file_dates.ts`: precise file date copying.
- `build_script_outputs.ts`: build-script output path relocation.

## Rules

- Source code never imports tests or skill instructions.
- Import implementation modules directly; the package public interface remains in the parent index.ts.
- Follow the repository folder constraints and personal TypeScript style.

## Background

- See the parent [CONTEXT.md](../CONTEXT.md) for package responsibilities.

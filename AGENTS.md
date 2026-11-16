# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code.

## Language

Write in plain international English. Do not use jargon, slang, idioms, or invented nicknames for things, including internal names for on-screen elements, tools, or concepts.

- Describe things in ordinary words, not by an internal or technical name. For example, do not call an on-screen clickable suggestion a "chip" — say "a small clickable suggestion on the screen".
- If a precise technical term is genuinely needed, spell it out in full and explain it in plain words the first time it is used. Do not use abbreviations.
- Do not drop the noun and lean on words like "it", "that", or "this one" to refer back to something named earlier — repeat the noun.
- Prefer the plainest sentence that still says the whole thing over a clever or economical sentence.
- Once something has an established name — in the source code, in the project, or earlier in the conversation — use that exact name every time. Do not shorten a multi-word name down to one word, and do not swap in a different word that means roughly the same thing.

See [issue #395](https://github.com/jeromeetienne/warmly_private/issues/395) for a worked example.

## De-risk Before Building

Before writing implementation code for a feature that depends on an unproven external dependency (a transport, a tool, a third-party API, a specific runtime environment), first name the single assumption that would make the feature impossible, and prove or kill the assumption with the smallest live test against the real environment — not a headless, proxy, or mocked stand-in, and not an empty or unrepresentative state. Do not report a gate as passed unless the test exercised the actual constraint. Show raw output and say what was tested, rather than generalizing a conclusion from one run.

See the [retrospective #311](https://github.com/jeromeetienne/warmly_private/issues/311) and [original work #300](https://github.com/jeromeetienne/warmly_private/issues/300): the feasibility test used `--cdp-endpoint` instead of the real `--extension` transport and incorrectly reported success.

## Tech Stack - Typescript

When writing TypeScript, use:

- TypeScript (ES2020, strict), run via `tsx` for development.
- Zod for runtime validation of SKILL.md frontmatter.
- Commander.js for command-line argument parsing in both packages.
- Chalk for terminal colors in `bsky_cli`.
- Prefer monorepos for related packages and manage monorepos with pnpm workspaces.

## Required Skills

- Use `$typescript-javascript-style` before creating or editing a TypeScript, TypeScript with JSX, JavaScript, JavaScript with JSX, MJS, or CJS file.
- Use `$context-md-management` before creating, editing, or reviewing a `CONTEXT.md` file, or before creating a source-code directory.
- Apply the installed personal Rust and TypeScript and JavaScript styles through The Rules of the Repo.

## Git

### Commit messages

- Do not append a `Co-Authored-By: Codex` trailer or any Anthropic or Codex email to commit messages. The commit message contains only the change description.
- When a commit is about a GitHub issue, always mention the issue number.
- If the commit fixes a GitHub issue, use `fixes #xxx`.

### Pull requests

Do not append the "🤖 Generated with Codex" line or any Codex or Anthropic attribution to pull request descriptions.

### GitHub issues

When referencing a commit in a GitHub issue, always use a link, never only the hexadecimal commit identifier.

### Referencing commits

Whenever mentioning a commit identifier anywhere — chat, issues, pull requests, or commit messages — render the commit identifier as a link to the commit on its remote repository.

## The Rules of the Repo

Before every change of this repository, follow the skill [rules_of_the_repo](.agents/skills/rules_of_the_repo/SKILL.md): read the rules list, and obey each rule skill that applies to the change, with its configuration.

- Rules list: [.agents/rules_of_the_repo/rules_list.md](.agents/rules_of_the_repo/rules_list.md).

## Issue Fix Workflow

Every issue fix follows [issue_fix_workflow](.agents/skills/issue_fix_workflow/SKILL.md). Read the skill before starting an issue fix.

### Issue Fix Workflow values

- Target branch: `main`.
- Worktree folder: `.agents/worktree/<branch>`, relative to the main checkout.
- Worktree creation command: run the following commands from the main checkout, replacing `<branch>` with the temporary branch name.

```bash
git fetch origin main
git worktree add -b <branch> .agents/worktree/<branch> origin/main
```

- Launch command: not available; this repository has no application code. Configure and verify a real launch command when application code is added. Do not report application review as passed while the launch command is unavailable.
- Issue tracker commands: use the commands below for `jeromeetienne/faster-rust-worktrees`, replacing angle-bracket values. Write multiline descriptions and comments to files and use `--body-file`.

```bash
gh issue view <number> --repo jeromeetienne/faster-rust-worktrees --comments
gh issue comment <number> --repo jeromeetienne/faster-rust-worktrees --body-file <body-file>
gh issue create --repo jeromeetienne/faster-rust-worktrees --title <title> --body-file <body-file>
gh pr create --repo jeromeetienne/faster-rust-worktrees --base main --head <branch> --title <title> --body-file <body-file>
gh pr merge <number> --repo jeromeetienne/faster-rust-worktrees --merge
gh issue close <number> --repo jeromeetienne/faster-rust-worktrees
```

- Chat rename: not available.

## Issue Batch Workflow

A parent issue with two or more related sub-issues follows [issue_batch_workflow](.agents/skills/issue_batch_workflow/SKILL.md) in place of the Issue Fix Workflow. Use the same Issue Fix Workflow values.

## Other installed workflows

- Use [issue_creation](.agents/skills/issue_creation/SKILL.md) when creating issues or writing issue descriptions or comments.
- Use [pull_request_creation](.agents/skills/pull_request_creation/SKILL.md) when preparing or revising pull request titles and descriptions.
- Use [git_cleanup_review](.agents/skills/git_cleanup_review/SKILL.md) for worktree and branch cleanup reviews.
- Use [keep-a-changelog-workflow](.agents/skills/keep-a-changelog-workflow/SKILL.md) when creating, updating, or validating a changelog.

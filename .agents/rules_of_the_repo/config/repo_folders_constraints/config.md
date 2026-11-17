# Repo Folders Constraints

## Packages

The repository is a pnpm monorepo. Receiving repositories configure the shared tool instead of copying implementation.

| Folder | Does | Never does | May import | Language and technologies | Workflow |
|---|---|---|---|---|---|
| packages/faster_rust_worktrees/ | Reusable Rust worktree creation and preview-first cleanup | Hold application-specific assumptions | no other package | Strict TypeScript ES2020, Commander.js, Zod, tsx; pnpm | Follow AGENTS.md and automated verification |

## Other folders

Rules cover descendants unless a more specific row applies. Git's internal `.git/` folder is managed by Git.

| Folder | Does | Never does | Language and technologies | Workflow |
|---|---|---|---|---|
| / | Repository overview and instructions | Hold temporary worktrees outside the configured location | Markdown, Git configuration, pnpm workspace configuration, npm entry package | Follow AGENTS.md and The Rules of the Repo |
| .agents/ | Agent skills, repository configuration, temporary worktrees | Mix repository settings into reusable skills | Markdown, skill metadata, symbolic links | Follow The Rules of the Repo |
| .agents/skills/ | Installed reusable skill instructions and resources | Hold receiving-repository configuration | Installed skill formats | Preserve portable skill content; keep repository settings outside skill folders |
| .agents/rules_of_the_repo/ | Rules list, folder constraints, per-skill configuration | Hold application source code | Markdown | Folder constraints require human approval; maintain other configuration through The Rules of the Repo |
| .agents/worktree/ | Temporary Git worktrees | Hold the main checkout | Git worktrees | Use the configured Issue Fix Workflow command; each worktree follows its own repository instructions |
| .claude/ | Claude Code discovery settings | Duplicate installed skill content | Symbolic links | Keep skill links directed to .agents/skills/ |
| docs/ | Repository documentation | Hold application source code or temporary worktrees | Markdown | Follow docs_folder_system; metadata exceptions: none |
| packages/ | pnpm workspace packages | Hold application-specific code | pnpm | Follow package rules |
| packages/faster_rust_worktrees/src/ | Shared tool implementation | Import tests or skill instructions | Strict TypeScript ES2020 | Follow personal TypeScript style |
| packages/faster_rust_worktrees/tests/ | Automated tests and disposable Rust fixtures | Retain temporary fixtures | TypeScript and generated Rust | Run automated verification |
| skills/ | Canonical reusable skills | Hold receiving-repository configuration | Markdown | Follow skill-creator |
| skills/faster_rust_worktrees/ | Canonical skill and supporting references | Duplicate tool implementation | Skill Markdown | Keep draft status until independent evaluation supports changing status |

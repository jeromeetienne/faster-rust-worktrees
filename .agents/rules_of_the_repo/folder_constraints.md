# Repo Folders Constraints

## Packages

No application packages exist yet. Package responsibilities, imports, languages, and technologies are not decided yet.

| Folder | Does | Never does | May import | Language and technologies | Workflow |
|---|---|---|---|---|---|

## Other folders

Rules cover descendants unless a more specific row applies. Git's internal `.git/` folder is managed by Git.

| Folder | Does | Never does | Language and technologies | Workflow |
|---|---|---|---|---|
| / | Repository overview and instructions | Hold temporary worktrees outside the configured location | Markdown and Git configuration; application technologies not decided yet | Follow AGENTS.md and The Rules of the Repo |
| .agents/ | Agent skills, repository configuration, temporary worktrees | Mix repository settings into reusable skills | Markdown, skill metadata, symbolic links | Follow The Rules of the Repo |
| .agents/skills/ | Installed reusable skill instructions and resources | Hold receiving-repository configuration | Installed skill formats | Preserve portable skill content; keep repository settings outside skill folders |
| .agents/rules_of_the_repo/ | Rules list, folder constraints, per-skill configuration | Hold application source code | Markdown | Folder constraints require human approval; maintain other configuration through The Rules of the Repo |
| .agents/worktree/ | Temporary Git worktrees | Hold the main checkout | Git worktrees | Use the configured Issue Fix Workflow command; each worktree follows its own repository instructions |
| .claude/ | Claude Code discovery settings | Duplicate installed skill content | Symbolic links | Keep skill links directed to .agents/skills/ |
| docs/ | Repository documentation | Hold application source code or temporary worktrees | Markdown | Follow docs_folder_system; metadata exceptions: none |

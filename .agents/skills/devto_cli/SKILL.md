---
name: devto_cli
description: Create, update, schedule, read, preview, and list dev.to articles, upload images, read comments, read analytics, and search articles with the command line devto_cli, with the API key stored one time by the command login. Use it when the developer asks to post an article on dev.to as a draft, to publish it now or at a future date, to add a cover image or images, to update an article, to list or read articles or comments, to see the analytics, or to search dev.to.
---

# devto_cli

`devto_cli` is a command-line client of the [dev.to API](https://developers.forem.com/api). Run every command with `npx --yes github:jeromeetienne/devto_cli`. Run `npx --yes github:jeromeetienne/devto_cli <command> --help` for all the options of a command.

## Login

- Log in one time: the developer types `npx --yes github:jeromeetienne/devto_cli login` in a terminal, and pastes the API key. The command does not show the API key. The command checks the API key with dev.to, then stores the API key in `~/.config/devto_cli/credentials.json`. Every other command reads the API key from that file. A script can pipe the API key: `printf '%s' "$DEVTO_API_KEY" | npx --yes github:jeromeetienne/devto_cli login`.
- Without a login: set the environment variable `DEVTO_API_KEY`. Every command uses `DEVTO_API_KEY` before the credential file.
- Check the login: `npx --yes github:jeromeetienne/devto_cli status` says where the API key comes from and whether dev.to accepts it. The exit code is 1 when the user is not logged in, or when the API key is not valid.
- Log out: `npx --yes github:jeromeetienne/devto_cli logout` deletes the stored API key.

Never write the API key in a repository, in an issue, in a commit, or in a log message.

## The output format

Every command except `login`, `status`, and `logout` takes `--format <format>`:

- `tty` (the default): text for the terminal, with colors.
- `markdown`: a Markdown table or Markdown text.
- `json`: all the fields that dev.to sends, for a script or a coding agent.

## Articles

```bash
npx --yes github:jeromeetienne/devto_cli create --title "My title" --body-file ./article.md --tags "typescript,cli" --cover-image ./cover.png
npx --yes github:jeromeetienne/devto_cli update <article identifier> --title "New title"
npx --yes github:jeromeetienne/devto_cli get <article identifier>
npx --yes github:jeromeetienne/devto_cli preview --body-file ./article.md
npx --yes github:jeromeetienne/devto_cli list --filter unpublished
```

- `create` makes a draft. Add `--publish` to publish now, or `--publish-at 2026-12-01T09:00:00Z` to publish at a future date.
- `update` takes the same options as `create`, and `--draft` to change a published article back into a draft. dev.to refuses `PUT /articles/{id}/unpublish` for an author, so `--draft` is the way to unpublish.
- `get` shows one article with its text: a published article, or a draft of the user.
- `preview` shows the HTML of an article without saving it. It does not upload the local images.
- `list` lists the articles of the user. The filter is `all`, `published`, or `unpublished`.

## Images

- `npx --yes github:jeromeetienne/devto_cli image upload ./image.png` uploads an image and writes its address. With `--format markdown`, it writes `![image.png](<address>)`. The image is public as soon as it is uploaded.
- `create` and `update` upload a local file automatically: a local path in `--cover-image`, and each local image `![alt](./path.png)` of the text. A relative path in the text starts from the folder of the `--body-file` file.
- The extensions are `.png`, `.jpg`, `.jpeg`, `.gif`, and `.webp`.
- dev.to limits the number of uploads in a short time. `devto_cli` waits and retries 3 times after an answer 429.

## Comments

- `npx --yes github:jeromeetienne/devto_cli comment list <article identifier>` lists the comments of an article, with their answers.
- `npx --yes github:jeromeetienne/devto_cli comment get <comment identifier>` shows one comment, for example `comment get 3ldoo`.
- The dev.to API cannot post a comment.

## Analytics

```bash
npx --yes github:jeromeetienne/devto_cli analytics totals
npx --yes github:jeromeetienne/devto_cli analytics historical --start 2026-11-01 --end 2026-11-17
npx --yes github:jeromeetienne/devto_cli analytics past_day
npx --yes github:jeromeetienne/devto_cli analytics referrers
```

Add `--article <article identifier>` for one article.

## Search

```bash
npx --yes github:jeromeetienne/devto_cli search articles rust compile time
npx --yes github:jeromeetienne/devto_cli search articles --semantic how to make rust builds faster
npx --yes github:jeromeetienne/devto_cli search published --tag typescript --username someone --top 7
```

- `search articles` searches the words in the titles, the tags, and the text. `--top <days>` keeps only the articles of the last N days.
- `search articles --semantic` searches by meaning, not by exact words.
- `search published` lists the published articles with a tag, of a user or of an organization, or the most popular of the last N days.

## What the dev.to API does not allow with an API key

- Reactions: `POST /reactions/toggle` answers 401.
- Unpublish: `PUT /articles/{id}/unpublish` answers 401. Use `update <id> --draft`.
- Search users: `GET /users/search` answers 401, and it searches by exact email address only.
- Post a comment: the API has no operation for it.
- Delete an article: the API has no operation for it. To delete a draft, open the draft on the dev.to website, then choose "Delete". Each draft that a test creates stays on dev.to until the user deletes it there.

## Rules

- Before you publish an article, or schedule an article, ask the developer.
- To test, create a draft only.

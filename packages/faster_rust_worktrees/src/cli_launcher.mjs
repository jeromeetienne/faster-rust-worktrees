#!/usr/bin/env node
import { tsImport } from 'tsx/esm/api';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CliLauncher — starts the TypeScript executable from its installed package
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The root package.json registers this file as the installed faster-rust-worktrees command. The first line asks
 * the operating system to run this JavaScript module with Node.js, which then imports tsx from the package's
 * own dependencies. Running `tsx cli.ts` works inside a package script, such as `pnpm dev`, because the package
 * manager adds locally installed commands to the command search path for that script. An installed command
 * launched directly from another repository does not have the same guarantee: declaring tsx in package.json
 * installs tsx, but does not by itself make the tsx executable available on the user's command search path.
 * Pointing the installed command at a TypeScript file with `#!/usr/bin/env tsx` would therefore depend on the
 * caller's environment. This launcher instead imports the installed tsx module through normal Node.js package
 * resolution and uses tsImport to load and execute cli.ts. Passing import.meta.url resolves cli.ts relative to
 * this launcher, regardless of the caller's current directory. cli.ts then parses the command-line arguments
 * and runs the requested operation. This keeps the implementation in TypeScript without a separate compilation
 * step, a global tsx installation, or an npx invocation to locate the TypeScript runner.
 */
await tsImport('./cli.ts', import.meta.url);

import ChildProcess from 'node:child_process';
import { Configuration } from './configuration.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ProcessCommand — runs configured commands without a shell
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Configured process runner with explicit working directories. */
export class ProcessCommand {
	/**
	 * Runs a command, preserving output for diagnostics.
	 * @param root Checkout root.
	 * @param cwd Command working directory relative to the checkout.
	 * @param argv Executable followed by arguments.
	 * @param environment Additional environment variables.
	 * @returns Combined process output.
	 */
	static run(root: string, cwd: string, argv: string[], environment: NodeJS.ProcessEnv = {}): string {
		const result = ChildProcess.spawnSync(argv[0], argv.slice(1), {
			cwd: Configuration.path(root, cwd, true),
			encoding: 'utf8',
			maxBuffer: 256 * 1024 * 1024,
			env: {
				...process.env,
				...environment,
			},
		});
		const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
		if (result.error !== undefined || result.status !== 0) {
			throw new Error(`${argv.join(' ')} failed in ${cwd}: ${result.error?.message ?? ''}\n${output}`);
		}
		return output;
	}
}

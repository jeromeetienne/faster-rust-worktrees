import ChildProcess from 'node:child_process';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	FileDates — preserves exact nanosecond timestamps through the native file system
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Batched exact timestamp restoration; JavaScript Date loses Cargo fingerprint precision. */
export class FileDates {
	/**
	 * Copies timestamps without converting nanoseconds to JavaScript dates.
	 * @param pairs Source and destination path pairs.
	 * @returns Nothing.
	 */
	static copy(pairs: Array<[string, string]>): void {
		FileDates._run([
			'import json, os, sys',
			'for source, destination in json.load(sys.stdin):',
			'    stat = os.stat(source, follow_symlinks=False)',
			'    os.utime(destination, ns=(stat.st_atime_ns, stat.st_mtime_ns), follow_symlinks=False)',
		].join('\n'), pairs);
	}

	/**
	 * Restores timestamps captured before rewriting a Cargo record.
	 * @param records Destination paths and exact access and modification nanoseconds as decimal strings.
	 * @returns Nothing.
	 */
	static restore(records: Array<[string, string, string]>): void {
		FileDates._run([
			'import json, os, sys',
			'for path, access, modified in json.load(sys.stdin):',
			'    os.utime(path, ns=(int(access), int(modified)), follow_symlinks=False)',
		].join('\n'), records);
	}

	/**
	 * Runs one isolated Python operation per batch.
	 * @param program Python program.
	 * @param values Input timestamp operations.
	 * @returns Nothing.
	 */
	private static _run(program: string, values: string[][]): void {
		if (values.length === 0) {
			return;
		}
		const result = ChildProcess.spawnSync('python3', ['-I', '-c', program], {
			input: JSON.stringify(values),
			encoding: 'utf8',
		});
		if (result.error !== undefined || result.status !== 0) {
			throw new Error(`Exact Cargo timestamps require Python 3: ${result.error?.message ?? result.stderr}`);
		}
	}
}

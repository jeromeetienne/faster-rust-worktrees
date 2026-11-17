import Fs from 'node:fs';
import Path from 'node:path';
import { FileDates } from './file_dates.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	BuildScriptOutputs — relocates cloned Cargo build script records
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Rewrites records across all profiles and target triples, retaining record dates. */
export class BuildScriptOutputs {
	/**
	 * Replaces checkout prefixes only in Cargo build script output records.
	 * @param source Original checkout root.
	 * @param destination New checkout root.
	 * @param target Cloned target directory.
	 * @returns Count of relocated records.
	 */
	static rewrite(source: string, destination: string, target: string): number {
		const records: Array<[string, string, string]> = [];
		const count = BuildScriptOutputs._rewrite(source, destination, target, records);
		FileDates.restore(records);
		return count;
	}

	/**
	 * Traverses real directories while capturing exact record timestamps.
	 * @param source Original checkout root.
	 * @param destination New checkout root.
	 * @param target Directory to traverse.
	 * @param records Exact timestamps to restore after writing.
	 * @returns Number of rewritten records.
	 */
	private static _rewrite(source: string, destination: string, target: string,
		records: Array<[string, string, string]>): number {
		let count = 0;
		for (const entry of Fs.readdirSync(target, {
			withFileTypes: true,
		})) {
			const path = Path.join(target, entry.name);
			if (entry.isDirectory() === true) {
				count += BuildScriptOutputs._rewrite(source, destination, path, records);
			} else if (entry.isFile() === true && entry.name === 'output'
				&& Path.basename(Path.dirname(Path.dirname(path))) === 'build') {
				const text = Fs.readFileSync(path, 'utf8');
				const rewritten = text.split(`${source}${Path.sep}`).join(`${destination}${Path.sep}`);
				if (rewritten !== text) {
					const stat = Fs.statSync(path, {
						bigint: true,
					});
					Fs.writeFileSync(path, rewritten);
					records.push([path, String(stat.atimeNs), String(stat.mtimeNs)]);
					count += 1;
				}
			}
		}
		return count;
	}
}

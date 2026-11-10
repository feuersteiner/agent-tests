import { readdirSync } from 'node:fs';
import { posix } from 'node:path';
import { Minimatch } from 'minimatch';
import type { AgentTestConfig } from '../../src/config/types.ts';
import { DirectorySource } from '../../src/shared/sources/dir.ts';
import { FileSource } from '../../src/shared/sources/file.ts';
import type { Source } from '../../src/shared/sources/source.ts';

/** Discover sources while pruning ignored paths and their descendants. */
export const loadSources = (config: Pick<AgentTestConfig, 'ignore'>): Source[] => {
	const options = { dot: true, platform: 'linux' } as const;
	const ignored = config.ignore.map((pattern) => new Minimatch(pattern, options));
	const walk = (directory: string): Source[] =>
		readdirSync(directory || '.', { withFileTypes: true }).flatMap((entry): Source[] => {
			const isDirectory = entry.isDirectory();
			if (!isDirectory && !entry.isFile()) return [];
			const path = posix.join(directory, entry.name);
			if (
				ignored.some((pattern) => pattern.match(path) || (isDirectory && pattern.match(`${path}/`)))
			)
				return [];
			return isDirectory ? [new DirectorySource(path), ...walk(path)] : [new FileSource(path)];
		});
	return walk('');
};

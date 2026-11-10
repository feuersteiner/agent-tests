import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DirectorySource } from '../../src/shared/sources/dir.ts';
import { FileSource } from '../../src/shared/sources/file.ts';
import type { Source } from '../../src/shared/sources/source.ts';

const excluded = new Set<string>(['.git', '.agents', 'node_modules']);

/** Include directory snapshots and their descendants without following symlinks. */
export const loadSources = (directory: string = ''): Source[] =>
	readdirSync(directory || '.', { withFileTypes: true }).flatMap((entry): Source[] => {
		if (excluded.has(entry.name)) return [];
		const path = join(directory, entry.name);
		return entry.isDirectory()
			? [new DirectorySource(path), ...loadSources(path)]
			: entry.isFile()
				? [new FileSource(path)]
				: [];
	});

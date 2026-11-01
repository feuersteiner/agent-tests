import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { LibraryFiles, LibrarySource, ManagedSourceSnapshot } from './types.js';

export const sourceFile = '.agent-tests-source.json';

/** Hash exactly the installed bytes; metadata never contains credentials. */
export const hash = (text: string): string => createHash('sha256').update(text).digest('hex');

/** Record the pinned catalog commit and originals for conservative update/removal. */
export const createSource = (
	files: LibraryFiles,
	repository: string,
	ref: string,
	commit: string
): LibrarySource => ({
	version: 1,
	repository,
	ref,
	commit,
	proseHash: hash(files.prose),
	yamlHash: hash(files.yaml)
});

const readRegularFile = async (path: string): Promise<string> => {
	const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
	try {
		if (!(await file.stat()).isFile()) throw new Error('Managed payload must be a regular file.');
		return await file.readFile('utf8');
	} finally {
		await file.close();
	}
};

/** Capture exact regular-file bytes and provenance; extra files or edits invalidate the snapshot. */
export const readManagedSnapshot = async (
	directory: string
): Promise<ManagedSourceSnapshot | undefined> => {
	try {
		const names = await readdir(directory);
		if (
			names.length !== 3 ||
			names.some((name) => !['TEST.md', 'test.yaml', sourceFile].includes(name))
		)
			return undefined;
		for (const name of names) {
			const stat = await lstat(join(directory, name));
			if (!stat.isFile() || stat.isSymbolicLink()) return undefined;
		}
		const metadata = await readRegularFile(join(directory, sourceFile));
		const source: unknown = JSON.parse(metadata);
		if (!source || typeof source !== 'object') return undefined;
		const data = source as LibrarySource;
		if (
			data.version !== 1 ||
			typeof data.repository !== 'string' ||
			typeof data.ref !== 'string' ||
			!/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(data.commit)
		)
			return undefined;
		const [prose, yaml] = await Promise.all([
			readRegularFile(join(directory, 'TEST.md')),
			readRegularFile(join(directory, 'test.yaml'))
		]);
		if (hash(prose) !== data.proseHash || hash(yaml) !== data.yamlHash) return undefined;
		if ((await readdir(directory)).sort().join('\0') !== names.sort().join('\0')) return undefined;
		return { source: data, fingerprint: hash(JSON.stringify([prose, yaml, metadata])) };
	} catch {
		return undefined;
	}
};

/** Read valid installed provenance without exposing the internal byte fingerprint. */
export const readManagedSource = async (directory: string): Promise<LibrarySource | undefined> =>
	(await readManagedSnapshot(directory))?.source;

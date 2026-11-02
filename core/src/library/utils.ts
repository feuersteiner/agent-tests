import { lstat, mkdir, open, readdir, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import type { LibraryFiles, LibrarySource, ManagedSourceSnapshot } from './types.js';

/** Accept lowercase kebab-case id or throw before using it as a catalog/project path. */
export const assertId = (id: string): void => {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Invalid library test id.');
};

/**
 * Resolve targetDir below the real project root to its canonical id installation directory.
 * @param create Create missing parent directories only; never create/replace the test itself.
 * @returns Canonical target even when absent.
 * @throws Invalid ids, escapes, child symlinks/files, or filesystem errors.
 */
export const testDirectory = async (
	root: string,
	id: string,
	targetDir: string,
	create = false
): Promise<string> => {
	assertId(id);
	const base = await realpath(root);
	const owner = resolve(base, targetDir);
	const parts = relative(base, join(owner, '.agents', 'tests', id));
	if (
		parts === '..' ||
		parts.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) ||
		isAbsolute(parts)
	)
		throw new Error('The target directory must stay inside the project.');
	let current = base;
	for (const part of parts.split(/[\\/]/)) {
		current = join(current, part);
		try {
			const stat = await lstat(current);
			if (stat.isSymbolicLink() || !stat.isDirectory())
				throw new Error('Library paths must be real directories, not symlinks or files.');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			if (create && current !== join(base, parts)) await mkdir(current);
		}
	}
	return current;
};

/** Return whether path exists without following its final symlink; propagate errors except ENOENT. */
export const exists = async (path: string): Promise<boolean> => {
	try {
		await lstat(path);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
};

export const sourceFile = '.agent-tests-source.json';

/** Return the SHA-256 digest of UTF-8 text for exact installed-byte comparison. */
export const hash = (text: string): string => createHash('sha256').update(text).digest('hex');

/** Return provenance for files and repository/ref/commit, storing hashes rather than credentials. */
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

/** Read UTF-8 bytes without following a final symlink; reject nonregular files and close on failure. */
const readRegularFile = async (path: string): Promise<string> => {
	const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
	try {
		if (!(await file.stat()).isFile()) throw new Error('Managed payload must be a regular file.');
		return await file.readFile('utf8');
	} finally {
		await file.close();
	}
};

/**
 * Read directory's exact managed payload and provenance for last-moment conflict detection.
 * @returns Source/fingerprint, or undefined for unreadable, malformed, edited, or extra files.
 */
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

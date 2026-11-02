import { mkdir, mkdtemp, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { sourceFile } from './utils.js';
import type { LibraryFiles, LibrarySource } from './types.js';

/** Reserve an absent target; return false for an existing entry and propagate other mkdir errors. */
const reserveTarget = async (directory: string): Promise<boolean> => {
	try {
		await mkdir(directory);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
		throw error;
	}
};

/**
 * Stage files/source beside directory and publish after verify accepts the current target twice.
 * @param replace Whether to replace a verified managed copy instead of reserving a new directory.
 * @returns True after publication; false preserves data when verification/reservation conflicts.
 * @throws Filesystem/verification errors; restore the previous copy if publication fails.
 */
export const writeTest = async (
	directory: string,
	files: LibraryFiles,
	source: LibrarySource,
	replace: boolean,
	verify: () => Promise<boolean>
): Promise<boolean> => {
	if (!(await verify())) return false;
	const staging = await mkdtemp(join(dirname(directory), '.agent-tests-install-'));
	let backup: string | undefined;
	let published = false;
	let reserved = false;
	try {
		await Promise.all([
			writeFile(join(staging, 'TEST.md'), files.prose, { flag: 'wx' }),
			writeFile(join(staging, 'test.yaml'), files.yaml, { flag: 'wx' }),
			writeFile(join(staging, sourceFile), `${JSON.stringify(source, null, 2)}\n`, { flag: 'wx' })
		]);
		if (!(await verify())) return false;
		if (replace) {
			const previous = `${staging}-previous`;
			await rename(directory, previous);
			backup = previous;
		}
		if (!replace) {
			reserved = await reserveTarget(directory);
			if (!reserved) return false;
		}
		await rename(staging, directory);
		published = true;
		if (backup) await rm(backup, { recursive: true });
		return true;
	} catch (error) {
		if (backup && !published) await rename(backup, directory);
		throw error;
	} finally {
		if (reserved && !published) await rmdir(directory).catch(() => undefined);
		await rm(staging, { recursive: true, force: true });
	}
};

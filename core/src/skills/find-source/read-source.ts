import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CompilationSource } from './types.js';

/**
 * @param directory Real installed rule directory inside the canonical root.
 * @returns Regular TEST.md text and byte hash, or undefined when the source is absent.
 * @throws For symbolic/nonregular source files and other read failures.
 */
export const readSource = async (directory: string): Promise<CompilationSource | undefined> => {
	try {
		const source = join(directory, 'TEST.md');
		const stat = await lstat(source);
		if (!stat.isFile()) throw new Error('TEST.md must be a regular file, never a symbolic link');
		const bytes = await readFile(source);
		return {
			directory,
			text: bytes.toString('utf8'),
			sourceHash: `sha256:${createHash('sha256').update(bytes).digest('hex')}`
		};
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw error;
	}
};

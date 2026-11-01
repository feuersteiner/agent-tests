import { createHash } from 'node:crypto';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { childDirectories } from './directories.js';
import type { CompilationSource } from './types.js';

const readSource = async (directory: string): Promise<CompilationSource | undefined> => {
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

/** Locate one installed rule without requiring an existing or valid compiled test.yaml. */
export const findSource = async (root: string, id: string): Promise<CompilationSource> => {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Invalid test id');
	const base = await realpath(resolve(root));
	const matches: CompilationSource[] = [];
	const visit = async (directory: string): Promise<void> => {
		const owner = relative(base, directory);
		if (isAbsolute(owner) || owner === '..' || owner.startsWith(`..${sep}`))
			throw new Error('Test directory is outside the repository');
		const children = await childDirectories(directory);
		if (basename(directory) === 'tests' && basename(dirname(directory)) === '.agents') {
			const candidate = children.find((child) => child === join(directory, id));
			if (candidate) {
				const source = await readSource(candidate);
				if (source) matches.push(source);
			}
		}
		for (const child of children) await visit(child);
	};
	await visit(base);
	if (matches.length === 0) throw new Error(`No installed TEST.md found for ${id}`);
	if (matches.length > 1) throw new Error(`Test id ${id} is ambiguous; use its owning directory`);
	return matches[0]!;
};

import { lstat, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import type { AgentTest } from '../src/types.ts';
import { parseYaml } from '../src/config/parse.ts';
import { validateTest } from '../src/config/validate.ts';
import { safePath } from './files.ts';

export type InstalledTest = {
	id: string;
	owner: string;
	directory: string;
	test?: AgentTest;
	error?: string;
};

/** Discover tests at each owning directory without following symlinks. */
export const discover = async (root: string, selectedId?: string): Promise<InstalledTest[]> => {
	const found: InstalledTest[] = [];
	const visit = async (owner: string): Promise<void> => {
		const directory = join(root, owner, '.agents/tests');
		try {
			if (
				!(await lstat(join(root, owner, '.agents'))).isDirectory() ||
				!(await lstat(directory)).isDirectory()
			)
				throw new Error('Unsafe test directory');
			for (const entry of await readdir(directory, { withFileTypes: true })) {
				if (!entry.isDirectory() || (selectedId && entry.name !== selectedId)) continue;
				const item: InstalledTest = {
					id: entry.name,
					owner,
					directory: join(directory, entry.name)
				};
				try {
					for (const name of ['test.yaml', 'TEST.md'])
						if (!(await lstat(join(item.directory, name))).isFile())
							throw new Error('Unsafe test file');
					item.test = validateTest(
						parseYaml(await readFile(join(item.directory, 'test.yaml'), 'utf8'))
					);
					if (item.test.id !== item.id) throw new Error('Test id must match its directory');
					if (item.test.source) {
						const digest = `sha256:${createHash('sha256')
							.update(await readFile(join(item.directory, 'TEST.md')))
							.digest('hex')}`;
						if (digest !== item.test.source)
							throw new Error('TEST.md changed: recompile test.yaml');
					}
				} catch {
					item.error = 'Invalid or stale test definition';
				}
				found.push(item);
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
		for (const entry of await readdir(join(root, owner), { withFileTypes: true })) {
			if (entry.isDirectory() && safePath(entry.name))
				await visit(owner ? `${owner}/${entry.name}` : entry.name);
		}
	};
	await visit('');
	if (selectedId && !found.length) throw new Error('Requested test is not installed');
	return found.sort((a, b) => `${a.owner}/${a.id}`.localeCompare(`${b.owner}/${b.id}`));
};

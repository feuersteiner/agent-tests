import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { z } from 'zod';
import { IdSchema } from '../../src/shared/types.ts';
import { digest } from './catalog.ts';
import type { CatalogTest } from './catalog.ts';

const Receipt = z.strictObject({
	commit: z.string().regex(/^[a-f0-9]{40}$/),
	prose: z.string(),
	yaml: z.string()
});
const names = ['TEST.md', 'test.yaml', '.library.json'];

/** Refuse symlinks in every destination component before creating directories. */
export const destination = async (root: string, target: string, id: string): Promise<string> => {
	IdSchema.parse(id);
	const dir = resolve(root, target, '.agents/tests', id);
	const local = relative(root, dir);
	if (local.split(sep).includes('..')) throw new Error('Target must stay within the project');
	let parent = root;
	for (const part of local.split(sep).slice(0, -1)) {
		parent = join(parent, part);
		await mkdir(parent, { recursive: true });
		if (!(await lstat(parent)).isDirectory()) throw new Error('Unsafe install directory');
	}
	try {
		if (!(await lstat(dir)).isDirectory()) throw new Error('Unsafe installed test');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
	return dir;
};

const snapshot = async (dir: string): Promise<string[]> => {
	const files = (await readdir(dir)).sort();
	if (files.join() !== [...names].sort().join())
		throw new Error('Installed test has extra files; preserve local changes');
	for (const name of names)
		if (!(await lstat(join(dir, name))).isFile()) throw new Error('Unsafe installed file');
	return Promise.all(names.map((name) => readFile(join(dir, name), 'utf8')));
};
const unmodified = (contents: string[]): void => {
	const receipt = Receipt.parse(JSON.parse(contents[2]!));
	if (receipt.prose !== digest(contents[0]!) || receipt.yaml !== digest(contents[1]!))
		throw new Error('Local changes must be preserved; update or remove manually');
};

/** Stage complete files, lock cooperating writers, and verify edits again before publishing. */
export const publish = async (
	dir: string,
	test: CatalogTest | undefined,
	action: 'add' | 'update' | 'remove'
): Promise<void> => {
	const lock = `${dir}.lock`;
	await mkdir(lock);
	let staging: string | undefined;
	let backup: string | undefined;
	try {
		let before: string[] | undefined;
		if (action !== 'add') {
			before = await snapshot(dir);
			unmodified(before);
		} else {
			try {
				await lstat(dir);
				throw new Error('Test already installed');
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			}
		}
		if (test) {
			staging = await mkdtemp(join(dirname(dir), '.install-'));
			const receipt = JSON.stringify({
				commit: test.commit,
				prose: digest(test.prose),
				yaml: digest(test.yaml)
			});
			await Promise.all(
				[test.prose, test.yaml, receipt].map((content, index) =>
					writeFile(join(staging!, names[index]!), content, { flag: 'wx' })
				)
			);
		}
		if (before) {
			backup = await mkdtemp(join(dirname(dir), '.backup-'));
			await rm(backup, { recursive: true });
			await rename(dir, backup);
			if (JSON.stringify(await snapshot(backup)) !== JSON.stringify(before))
				throw new Error('Concurrent edits detected; original files retained');
		}
		if (staging) {
			await rename(staging, dir);
			staging = undefined;
		}
		if (backup) {
			await rm(backup, { recursive: true });
			backup = undefined;
		}
	} catch (error) {
		if (backup) {
			await rename(backup, dir);
			backup = undefined;
		}
		throw error;
	} finally {
		if (staging) await rm(staging, { recursive: true, force: true });
		await rm(lock, { recursive: true, force: true });
	}
};

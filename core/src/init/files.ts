import { execFile } from 'node:child_process';
import { appendFile, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import type { InitResult } from './types.js';

const execute = promisify(execFile);

const environmentIgnored = async (root: string, content: string): Promise<boolean> => {
	try {
		await execute('git', ['check-ignore', '--no-index', '--quiet', '--', '.env'], { cwd: root });
		return true;
	} catch (error) {
		if ((error as { code?: number }).code === 1) return false;
		// Without usable Git, only an exact final rule is safe to reuse; append otherwise.
		const last = content
			.split(/\r?\n/)
			.filter((line) => line.trim() && !line.startsWith('#'))
			.at(-1);
		return last === '.env' || last === '/.env';
	}
};

/** Refuse traversal and symlinks in writable setup paths. */
export const assertLocalPath = async (root: string, path: string): Promise<void> => {
	const name = relative(root, path);
	if (isAbsolute(name) || name === '..' || name.startsWith(`..${sep}`))
		throw new Error('Initialization path must remain inside the project');
	let current = root;
	for (const segment of name.split(sep).filter(Boolean)) {
		current = resolve(current, segment);
		try {
			if ((await lstat(current)).isSymbolicLink())
				throw new Error('Initialization preserves symbolic links; use a regular local path');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
	}
};

/** Create one file exclusively; existing user files are never replaced. */
export const createFile = async (
	result: InitResult,
	name: string,
	content: string,
	mode?: number
): Promise<void> => {
	const path = resolve(result.root, name);
	await assertLocalPath(result.root, path);
	await mkdir(dirname(path), { recursive: true });
	try {
		await writeFile(path, content, { flag: 'wx', ...(mode === undefined ? {} : { mode }) });
		result.created.push(name);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
		result.skipped.push(name);
	}
};

/** Add the exact .env ignore without replacing any existing ignore rules. */
export const ignoreEnvironment = async (result: InitResult): Promise<void> => {
	const path = resolve(result.root, '.gitignore');
	await assertLocalPath(result.root, path);
	let content: string;
	try {
		content = await readFile(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		await createFile(result, '.gitignore', '.env\n');
		return;
	}
	if (await environmentIgnored(result.root, content)) return;
	await appendFile(path, `${content.length > 0 && !content.endsWith('\n') ? '\n' : ''}.env\n`);
	result.created.push('.gitignore (.env rule)');
};

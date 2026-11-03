import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, expect, it } from 'vitest';
import { initializeProject } from './index.js';

const execute = promisify(execFile);
const directories: string[] = [];
const tempGit = async (ignore: string): Promise<string> => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-ignore-'));
	directories.push(root);
	await execute('git', ['init', '-q'], { cwd: root });
	await writeFile(join(root, '.gitignore'), ignore);
	await writeFile(join(root, '.env'), '');
	return root;
};
const checkIgnored = (root: string): Promise<unknown> =>
	execute('git', ['check-ignore', '--', '.env'], { cwd: root });

afterEach(async () => {
	await Promise.all(
		directories.splice(0).map((root) => rm(root, { recursive: true, force: true }))
	);
});

it.each(['.env\n!.env\n', '/.env\n!/.env\n', '*\n!.env\n', '.env\n*\n!.env\n'])(
	'appends a final ignore when a later negation exposes .env: %j',
	async (ignore) => {
		const root = await tempGit(ignore);
		await expect(checkIgnored(root)).rejects.toMatchObject({ code: 1 });
		await initializeProject(root);
		expect(await readFile(join(root, '.gitignore'), 'utf8')).toBe(`${ignore}.env\n`);
		await expect(checkIgnored(root)).resolves.toMatchObject({ stdout: '.env\n' });
		await initializeProject(root);
		expect(await readFile(join(root, '.gitignore'), 'utf8')).toBe(`${ignore}.env\n`);
	}
);

it.each(['*\n', '.env\n!.env\n*\n', '*.env\n', '.env\n# Final comment\n'])(
	'preserves effective ignore rules including broad patterns: %j',
	async (ignore) => {
		const root = await tempGit(ignore);
		await expect(checkIgnored(root)).resolves.toMatchObject({ stdout: '.env\n' });
		await initializeProject(root);
		expect(await readFile(join(root, '.gitignore'), 'utf8')).toBe(ignore);
		await expect(checkIgnored(root)).resolves.toMatchObject({ stdout: '.env\n' });
	}
);

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, expect, it } from 'vitest';
import { initializeProject } from './index.js';

const execute = promisify(execFile);
const directories: string[] = [];
const project = async (): Promise<string> => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-hook-'));
	directories.push(root);
	await execute('git', ['init', '-q'], { cwd: root });
	return root;
};
afterEach(async () => {
	await Promise.all(
		directories.splice(0).map((root) => rm(root, { recursive: true, force: true }))
	);
});

it('installs an executable hook and preserves it on later initialization', async () => {
	const root = await project();
	const result = await initializeProject(root, { hook: true });
	const path = join(root, '.git/hooks/pre-commit');
	const hook = await readFile(path, 'utf8');
	expect(result.exitCode).toBe(0);
	expect(hook).toContain('exec npx --no -- agent-tests run --staged');
	expect((await stat(path)).mode & 0o111).toBeGreaterThan(0);
	await writeFile(path, '#!/bin/sh\necho custom\n');
	await initializeProject(root, { hook: true });
	expect(await readFile(path, 'utf8')).toBe('#!/bin/sh\necho custom\n');
});

it('preserves custom hooksPath rather than creating a disconnected default hook', async () => {
	const root = await project();
	await execute('git', ['config', 'core.hooksPath', '.custom-hooks'], { cwd: root });
	const result = await initializeProject(root, { hook: true });
	expect(result.warnings.join('\n')).toContain('core.hooksPath');
	await expect(stat(join(root, '.git/hooks/pre-commit'))).rejects.toMatchObject({ code: 'ENOENT' });
	await expect(stat(join(root, '.custom-hooks/pre-commit'))).rejects.toMatchObject({
		code: 'ENOENT'
	});
});

it('reports a requested hook cannot be installed outside Git', async () => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-no-git-'));
	directories.push(root);
	const result = await initializeProject(root, { hook: true });
	expect(result.exitCode).toBe(2);
	expect(result.warnings.join('\n')).toContain('requires a Git repository');
});

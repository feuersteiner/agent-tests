import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { parseTestYaml } from '../../schema/index.js';

const referenceDirectory = new URL('../../../../library/no-informal-english/', import.meta.url);
export const referenceDefinition = parseTestYaml(
	readFileSync(new URL('test.yaml', referenceDirectory), 'utf8')
);

export const createRoot = async (): Promise<string> => mkdtemp(join(tmpdir(), 'agent-discovery-'));

export const write = async (root: string, path: string, content: string): Promise<void> => {
	const target = join(root, path);
	await mkdir(dirname(target), { recursive: true });
	await writeFile(target, content);
};

export const installTest = async (
	root: string,
	owner = '',
	definition = referenceDefinition
): Promise<void> => {
	const directory = join(owner, '.agents/tests', definition.id);
	await write(root, join(directory, 'TEST.md'), 'Public copy uses formal English.');
	await write(root, join(directory, 'test.yaml'), JSON.stringify(definition));
};

const execute = promisify(execFile);
export const git = async (root: string, ...args: string[]): Promise<void> => {
	await execute('git', ['-C', root, ...args]);
};

export const initializeGit = async (root: string): Promise<void> => {
	await git(root, 'init', '-b', 'main');
	await git(root, 'config', 'user.email', 'tests@example.invalid');
	await git(root, 'config', 'user.name', 'Discovery tests');
};

import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { initializeProject } from './index.js';
import { loadConfiguration } from '../configuration/index.js';

const directories: string[] = [];
const project = async (): Promise<string> => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-init-'));
	directories.push(root);
	return root;
};
afterEach(async () => {
	await Promise.all(
		directories.splice(0).map((root) => rm(root, { recursive: true, force: true }))
	);
});

describe('project initialization', () => {
	it('creates valid credential-free config, env example, directory and ignore rule', async () => {
		const root = await project();
		const result = await initializeProject(root);
		expect(result.exitCode).toBe(0);
		expect((await stat(join(root, '.agents/tests'))).isDirectory()).toBe(true);
		expect((await loadConfiguration(root, {})).config).toEqual({});
		expect(await readFile(join(root, '.env.example'), 'utf8')).toContain('OPENAI_API_KEY=');
		expect(await readFile(join(root, '.gitignore'), 'utf8')).toBe('.env\n');
		expect(result.warnings.join('\n')).toContain('--hook');
		await expect(stat(join(root, '.env'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('repeats without replacing user config or duplicating ignore rules', async () => {
		const root = await project();
		await writeFile(join(root, 'agent-tests.config.yaml'), 'library: { ref: stable }\n');
		await writeFile(join(root, '.env.example'), 'CUSTOM_KEY=\n');
		await writeFile(join(root, '.gitignore'), 'node_modules/');
		await initializeProject(root);
		const result = await initializeProject(root);
		expect(await readFile(join(root, 'agent-tests.config.yaml'), 'utf8')).toBe(
			'library: { ref: stable }\n'
		);
		expect(await readFile(join(root, '.env.example'), 'utf8')).toBe('CUSTOM_KEY=\n');
		expect(await readFile(join(root, '.gitignore'), 'utf8')).toBe('node_modules/\n.env\n');
		expect(result.created).toEqual([]);
	});

	it('generates functional Vitest and full-history pull-request workflow templates', async () => {
		const root = await project();
		const result = await initializeProject(root, { vitest: true, github: true });
		expect(result.exitCode).toBe(0);
		expect(await readFile(join(root, 'vitest.config.ts'), 'utf8')).toContain(
			'plugins: [agentTests()]'
		);
		const workflow = parse(await readFile(join(root, '.github/workflows/agent-tests.yml'), 'utf8'));
		expect(workflow.on).toEqual({ pull_request: null });
		expect(workflow.permissions).toEqual({ contents: 'read' });
		expect(workflow.jobs['agent-tests'].steps[0].with['fetch-depth']).toBe(0);
		expect(workflow.jobs['agent-tests'].steps.at(-1).run).toBe(
			'npx --no -- agent-tests run --base origin/main'
		);
		const again = await initializeProject(root, { vitest: true, github: true });
		expect(again.created).toEqual([]);
	});

	it('never follows a setup-directory symlink outside the project', async () => {
		const root = await project();
		const outside = await project();
		await symlink(outside, join(root, '.agents'), 'dir');
		await expect(initializeProject(root)).rejects.toThrow('symbolic links');
		await expect(stat(join(outside, 'tests'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('does not append to symlinked ignore files', async () => {
		const root = await project();
		const outside = await project();
		await mkdir(join(root, '.agents/tests'), { recursive: true });
		await writeFile(join(outside, 'ignore'), 'preserve\n');
		await symlink(join(outside, 'ignore'), join(root, '.gitignore'));
		await expect(initializeProject(root)).rejects.toThrow('symbolic links');
		expect(await readFile(join(outside, 'ignore'), 'utf8')).toBe('preserve\n');
	});
});

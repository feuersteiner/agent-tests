import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPackedProject } from './package-support.js';
import type { PackedProject } from './package-support.js';

const root = fileURLToPath(new URL('../..', import.meta.url));
let project: PackedProject;
beforeAll(() => {
	project = createPackedProject(root);
}, 120_000);
afterAll(() => rmSync(project.temporary, { recursive: true, force: true }));

describe('published package', () => {
	it('ships Node JavaScript, public declarations, and an executable bin entry', () => {
		const files = project.packed.files.map((file) => file.path);
		expect(files).toContain('dist/index.js');
		expect(files).toContain('dist/index.d.ts');
		expect(files).toContain('dist-cli/index.js');
		expect(files).toContain('dist/vitest/index.js');
		expect(files).toContain('dist/vitest/runner.js');
		expect(files.some((file) => /^(src|cli|tests)\//.test(file))).toBe(false);
		const entry = readFileSync(
			path.join(project.temporary, 'node_modules/agent-tests/dist-cli/index.js'),
			'utf8'
		);
		expect(entry.startsWith('#!/usr/bin/env node')).toBe(true);
	});

	it('runs npx help offline and lists every V1 command', () => {
		const output = execFileSync('npx', ['--offline', '--no', '--', 'agent-tests', '--help'], {
			cwd: project.temporary,
			env: project.offlineEnvironment,
			encoding: 'utf8'
		});
		for (const command of [
			'init',
			'add',
			'update',
			'remove',
			'compile',
			'validate',
			'list',
			'targets',
			'eval',
			'run',
			'docs',
			'vote'
		])
			expect(output).toMatch(new RegExp(`^  ${command}(?: |$)`, 'm'));
	});

	it('imports the public library in a separate Node project offline', () => {
		const output = execFileSync(
			process.execPath,
			[
				'--input-type=module',
				'-e',
				"import { createRunResult, formatJson } from 'agent-tests'; console.log(formatJson(createRunResult()));"
			],
			{ cwd: project.temporary, env: project.offlineEnvironment, encoding: 'utf8' }
		);
		expect(JSON.parse(output)).toMatchObject({ exitCode: 0, checked: 0, findings: [] });
	});

	it('returns structured usage failures with exit 2', () => {
		const output = spawnSync(
			'npx',
			['--offline', '--no', '--', 'agent-tests', 'unknown', '--json'],
			{
				cwd: project.temporary,
				env: project.offlineEnvironment,
				encoding: 'utf8'
			}
		);
		expect(output.status).toBe(2);
		expect(JSON.parse(output.stderr)).toMatchObject({ exitCode: 2 });
	});

	it('runs actual agent checks through the packed Vitest subpath offline', () => {
		const temporary = project.temporary;
		const installed = path.join(temporary, '.agents/tests/no-informal-english');
		mkdirSync(installed, { recursive: true });
		mkdirSync(path.join(temporary, 'src'), { recursive: true });
		for (const file of ['TEST.md', 'test.yaml'])
			writeFileSync(
				path.join(installed, file),
				readFileSync(path.join(root, 'library/no-informal-english', file))
			);
		writeFileSync(path.join(temporary, 'src/help.md'), 'We are gonna save.');
		writeFileSync(
			path.join(temporary, 'ordinary.test.mjs'),
			"import { test } from 'vitest'; test('ordinary', () => {});"
		);
		writeFileSync(
			path.join(temporary, 'vitest.config.mjs'),
			[
				"import { defineConfig } from 'vitest/config';",
				"import { agentTests } from 'agent-tests/vitest';",
				"export default defineConfig({ plugins: [agentTests({scope: {paths: ['src/help.md']}})], test: {include: ['ordinary.test.mjs']} });"
			].join('\n')
		);
		const result = spawnSync(
			process.execPath,
			[
				'node_modules/vitest/vitest.mjs',
				'run',
				'--reporter=json',
				`--outputFile=${path.join(temporary, 'packed-vitest-result.json')}`
			],
			{
				cwd: temporary,
				env: project.offlineEnvironment,
				encoding: 'utf8'
			}
		);
		expect(result.status, result.stderr).toBe(1);
		const report = JSON.parse(
			readFileSync(path.join(temporary, 'packed-vitest-result.json'), 'utf8')
		);
		expect(report.numTotalTests).toBe(2);
		expect(report.numFailedTests).toBe(1);
		expect(JSON.stringify(report)).toContain('formal-vocabulary');
	});
});

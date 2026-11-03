import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { stringify } from 'yaml';
import type { CheckDefinition, TestDefinition } from '../../schema/index.js';

const execute = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const git = async (root: string, args: string[]): Promise<void> => {
	await execute('git', ['-C', root, ...args]);
};

/** Create an ordinary Vitest project with one changed prose target and installed definitions. */
export const createPluginFixture = async (
	content: string,
	checks: CheckDefinition[]
): Promise<string> => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-host-test-'));
	await symlink(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
	await mkdir(join(root, 'src'), { recursive: true });
	for (const [id, trigger] of [
		['reference', 'src/**/*.md'],
		['empty', 'absent/**/*.md']
	]) {
		const rule = join(root, '.agents/tests', id!);
		await mkdir(rule, { recursive: true });
		const definition: TestDefinition = {
			id: id!,
			title: id!,
			description: 'Reference test',
			triggers: { path: { match: trigger! } },
			checks,
			evals: []
		};
		await writeFile(join(rule, 'test.yaml'), stringify(definition));
	}
	await writeFile(join(root, 'src/help.md'), 'Original text');
	await writeFile(
		join(root, 'ordinary.test.ts'),
		"import { test, expect } from 'vitest'; test('ordinary', () => expect(1).toBe(1));\n"
	);
	await writeFile(
		join(root, 'vitest.config.mts'),
		[
			"import { defineConfig } from 'vitest/config';",
			`import { agentTests } from ${JSON.stringify(join(repository, 'core/src/vitest/index.ts'))};`,
			`export default defineConfig({ root: ${JSON.stringify(root)}, plugins: [agentTests()], test: { include: ['ordinary.test.ts'] } });`
		].join('\n')
	);
	await writeFile(
		join(root, 'annotations-reporter.mjs'),
		[
			"import { appendFileSync } from 'node:fs';",
			`export default class Reporter { onTestCaseResult = (item) => appendFileSync(${JSON.stringify(join(root, 'annotations.jsonl'))}, JSON.stringify(item.annotations()) + '\\n'); }`
		].join('\n')
	);
	await git(root, ['init', '-q']);
	await git(root, ['config', 'user.name', 'Test']);
	await git(root, ['config', 'user.email', 'test@example.invalid']);
	await git(root, ['add', '.agents', 'src', 'ordinary.test.ts', 'vitest.config.mts']);
	await git(root, ['commit', '-qm', 'fixture']);
	await writeFile(join(root, 'src/help.md'), content);
	return root;
};

/** Run the actual Vitest CLI and return its current JSON report with the original exit status. */
export const runPluginFixture = async (
	root: string
): Promise<{
	exitCode: number;
	report: {
		numTotalTests: number;
		numFailedTests: number;
		numPendingTests: number;
		testResults: unknown[];
	};
	output: string;
	annotations: unknown[];
}> => {
	const reportPath = join(root, 'results.json');
	const args = [
		join(repository, 'node_modules/vitest/vitest.mjs'),
		'run',
		'--config',
		join(root, 'vitest.config.mts'),
		'--maxWorkers',
		'1',
		'--reporter=json',
		'--reporter',
		join(root, 'annotations-reporter.mjs'),
		'--outputFile',
		reportPath
	];
	let exitCode = 0;
	let output: string;
	try {
		const result = await execute(process.execPath, args, {
			cwd: root,
			env: { ...process.env, CI: '' }
		});
		output = result.stdout + result.stderr;
	} catch (error) {
		const failure = error as { code: number; stdout: string; stderr: string };
		exitCode = failure.code;
		output = failure.stdout + failure.stderr;
	}
	try {
		const annotations = (await readFile(join(root, 'annotations.jsonl'), 'utf8'))
			.trim()
			.split('\n')
			.flatMap((line) => JSON.parse(line));
		return {
			exitCode,
			report: JSON.parse(await readFile(reportPath, 'utf8')),
			output,
			annotations
		};
	} catch {
		throw new Error(`Vitest did not produce a current report: ${output}`);
	}
};

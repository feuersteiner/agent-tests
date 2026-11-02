import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { createMockModel } from '../models/index.js';
import { parseTestYaml } from '../schema/index.js';
import type { TestDefinition } from '../schema/index.js';
import { evaluateTest } from './index.js';

const reference = async (): Promise<TestDefinition> =>
	parseTestYaml(
		await readFile(
			new URL('../../../library/no-informal-english/test.yaml', import.meta.url),
			'utf8'
		)
	);

describe('evals', () => {
	it('executes the reference fail/pass/skip examples through real stages', async () => {
		const definition = await reference();
		const result = await evaluateTest(definition);
		expect(result).toMatchObject({ passed: 5, failed: 0, skipped: 3, exitCode: 0 });
		expect(result.cases.map((example) => example.actual)).toEqual([
			'fail',
			'pass',
			'skip',
			'skip',
			'skip'
		]);
		expect(result.cases[0]!.findings).toContainEqual(
			expect.objectContaining({
				testId: 'no-informal-english',
				file: 'src/help/getting-started.md',
				level: 'fast',
				line: 1
			})
		);
	});

	it('reports disagreements rather than accepting mislabeled examples', async () => {
		const definition = await reference();
		definition.evals[0]!.expect = 'pass';
		const result = await evaluateTest(definition);
		expect(result).toMatchObject({ passed: 4, failed: 1, exitCode: 1 });
		expect(result.cases[0]).toMatchObject({ expected: 'pass', actual: 'fail', passed: false });
	});

	it('runs model-backed checks with mock answers and keeps missing-model skips distinct', async () => {
		const definition = await reference();
		delete definition.checks[0]!.fast;
		definition.checks[0]!.smart = { ask: 'Find informal English.' };
		const model = createMockModel([{ decision: 'fail' }, { decision: 'pass' }]);
		expect(await evaluateTest(definition, model)).toMatchObject({
			passed: 5,
			failed: 0,
			exitCode: 0
		});
		const missing = await evaluateTest(definition);
		expect(missing).toMatchObject({ passed: 3, failed: 2, skipped: 5, exitCode: 1 });
		expect(missing.cases[0]!.warnings.length).toBeGreaterThan(0);
	});

	it('reports model errors without leaking their contents', async () => {
		const definition = await reference();
		definition.triggers = { content: { ask: 'Select prose.' } };
		const model = createMockModel(() => {
			throw new Error('secret-token-value');
		});
		const result = await evaluateTest(definition, model);
		expect(result.exitCode).toBe(2);
		expect(result.cases.every((example) => example.actual === 'error')).toBe(true);
		expect(JSON.stringify(result)).not.toContain('secret-token-value');
	});

	it('isolates examples with conflicting file and directory paths', async () => {
		const definition = await reference();
		definition.triggers = { path: { match: '**' } };
		definition.evals = [
			{ name: 'File', path: 'src/example', content: 'Formal prose.', expect: 'pass' },
			{ name: 'Directory', path: 'src/example/sub.txt', content: 'Formal prose.', expect: 'pass' }
		];
		expect(await evaluateTest(definition)).toMatchObject({ passed: 2, failed: 0, exitCode: 0 });
	});

	it('rejects paths outside the fixture and refuses zero-example runs', async () => {
		const definition = await reference();
		definition.evals = [
			{ name: 'Traversal', path: '../escape.txt', content: 'gonna', expect: 'fail' }
		];
		expect(await evaluateTest(definition)).toMatchObject({ exitCode: 2, failed: 1 });
		definition.evals = [];
		await expect(evaluateTest(definition)).rejects.toThrow('at least one');
	});

	it('does not pass an expected skip when its model-backed trigger never ran', async () => {
		const definition = await reference();
		definition.triggers = { content: { ask: 'Select prose.' } };
		definition.evals = [{ name: 'Unrun', path: 'src/a.md', content: 'Hello', expect: 'skip' }];
		const result = await evaluateTest(definition);
		expect(result).toMatchObject({ passed: 0, failed: 1, exitCode: 1 });
		expect(result.cases[0]).toMatchObject({ actual: 'skip', passed: false, unrun: true });
	});
});

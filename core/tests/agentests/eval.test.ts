import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { StubAgentests } from '../helpers/agentests.ts';
import { testFolder, validConfig, validTest } from '../helpers/fixtures.ts';
import { inTempDir } from '../helpers/temp.ts';
import type { AgentTestEvalResult, AgentTestOutcome } from '../../src/eval/types.ts';

/** An eval result with each finding reduced to its source path and assertion id. */
const summarize = ({ eval: definition, actual, matches, findings }: AgentTestEvalResult) => ({
	eval: definition,
	actual,
	matches,
	findings: findings.map(({ source, assertion }) => ({
		path: source.path,
		assertion: assertion.id
	}))
});

/** The Test `no-fixme`: selects the TypeScript files under `src/` and fails each one holding FIXME. */
const noFixme = validTest({
	id: 'no-fixme',
	title: 'No FIXME',
	assert: [
		{ id: 'no-fixme', description: 'The file holds no FIXME.', error: 'Fix it.', grep: 'FIXME' }
	]
});

const SELECT_QUESTION = 'Is it a service?';
const ASSERT_QUESTION = 'Does it log its errors?';

/** A Test that selects and asserts with decide only. */
const decideTest = validTest({
	id: 'logs-errors',
	select: { glob: 'src/**/*.ts', decide: SELECT_QUESTION },
	assert: [
		{
			id: 'logs-errors',
			description: 'The service logs its errors.',
			error: 'Log the error.',
			decide: ASSERT_QUESTION
		}
	]
});

describe('Agentests.eval', () => {
	test('gives one result per Test with one entry per eval folder carrying the eval, actual, matches, and findings', async () => {
		const files = {
			...testFolder(validTest(), {
				clean: { expect: 'pass', files: { 'src/a.ts': 'ok' } },
				dirty: { expect: 'fail', files: { 'src/a.ts': '// TODO' } },
				wrong: { expect: 'pass', files: { 'src/b.ts': '// TODO' } }
			}),
			...testFolder(noFixme, { empty: { expect: 'skip', files: { 'docs/a.md': 'FIXME' } } })
		};
		await inTempDir(files, async () => {
			const results = await new StubAgentests(validConfig()).eval();
			const byTest = Object.fromEntries(results.map((result) => [result.test.id, result]));
			expect(results).toHaveLength(2);
			expect(byTest['no-todo']!.test).toEqual(validTest());
			expect(byTest['no-fixme']!.test).toEqual(noFixme);
			const evals = (id: string) => byTest[id]!.evals.map(summarize);
			expect(evals('no-todo')).toEqual([
				{
					eval: { id: 'clean', root: '.agents/tests/no-todo/evals/clean', expect: 'pass' },
					actual: 'pass',
					matches: true,
					findings: []
				},
				{
					eval: { id: 'dirty', root: '.agents/tests/no-todo/evals/dirty', expect: 'fail' },
					actual: 'fail',
					matches: true,
					findings: [{ path: 'src/a.ts', assertion: 'no-todo' }]
				},
				{
					eval: { id: 'wrong', root: '.agents/tests/no-todo/evals/wrong', expect: 'pass' },
					actual: 'fail',
					matches: false,
					findings: [{ path: 'src/b.ts', assertion: 'no-todo' }]
				}
			]);
			expect(evals('no-fixme')).toEqual([
				{
					eval: { id: 'empty', root: '.agents/tests/no-fixme/evals/empty', expect: 'skip' },
					actual: 'skip',
					matches: true,
					findings: []
				}
			]);
		});
	});

	test('gives an empty list of evals for a Test without an evals folder', async () => {
		await inTempDir(testFolder(validTest()), async () => {
			const results = await new StubAgentests(validConfig()).eval();
			expect(results).toEqual([{ test: validTest(), evals: [] }]);
		});
	});

	test('runs only the Test named by the id', async () => {
		const files = {
			...testFolder(validTest(), { clean: { expect: 'pass', files: { 'src/a.ts': 'ok' } } }),
			...testFolder(noFixme, { clean: { expect: 'pass', files: { 'src/a.ts': 'ok' } } })
		};
		await inTempDir(files, async () => {
			const results = await new StubAgentests(validConfig()).eval('no-fixme');
			expect(results.map((result) => result.test.id)).toEqual(['no-fixme']);
			expect(results[0]!.evals.map((result) => result.eval.id)).toEqual(['clean']);
		});
	});

	test('throws on an unknown id', async () => {
		await inTempDir(testFolder(validTest()), async () => {
			await expect(new StubAgentests(validConfig()).eval('missing')).rejects.toThrow(
				'Unknown test: missing'
			);
		});
	});

	test('throws one error listing an invalid eval.yaml', async () => {
		const files = {
			...testFolder(validTest(), {
				clean: { expect: 'pass', files: { 'src/a.ts': 'ok' } },
				broken: { expect: 'pass', files: {} }
			}),
			'.agents/tests/no-todo/evals/broken/eval.yaml': 'expect: maybe\n'
		};
		await inTempDir(files, async () => {
			const error = await new StubAgentests(validConfig()).eval().catch((thrown: Error) => thrown);
			expect(error).toBeInstanceOf(Error);
			const message = (error as Error).message;
			expect(message).toStartWith('1 of 2 eval(s) invalid:');
			expect(message).toContain('.agents/tests/no-todo/evals/broken/eval.yaml');
			expect(message).not.toContain('evals/clean');
		});
	});

	test('needs no Git repository', async () => {
		const files = testFolder(validTest(), {
			dirty: { expect: 'fail', files: { 'src/a.ts': '// TODO' } }
		});
		await inTempDir(files, async (dir) => {
			expect(existsSync(join(dir, '.git'))).toBe(false);
			const [result] = await new StubAgentests(validConfig()).eval();
			expect(result!.evals.map(summarize)[0]!.actual).toBe('fail');
		});
	});

	const cases: { outcome: AgentTestOutcome; select: number; assert: number }[] = [
		{ outcome: 'skip', select: 0, assert: 1 },
		{ outcome: 'fail', select: 1, assert: 0 },
		{ outcome: 'pass', select: 1, assert: 1 }
	];
	for (const { outcome, select, assert } of cases)
		test(`gives ${outcome} for a Test using decide when select scores ${select} and assert scores ${assert}`, async () => {
			const files = testFolder(decideTest, {
				service: { expect: outcome, files: { 'src/service.ts': 'export const run = () => {};' } }
			});
			await inTempDir(files, async () => {
				const decide = async (_input: string, criteria: unknown) =>
					criteria === SELECT_QUESTION ? select : assert;
				const [result] = await new StubAgentests(validConfig(), { decide }).eval();
				const [evalResult] = result!.evals;
				expect(evalResult!.actual).toBe(outcome);
				expect(evalResult!.matches).toBe(true);
				expect(evalResult!.findings.map((finding) => finding.source.path)).toEqual(
					outcome === 'fail' ? ['src/service.ts'] : []
				);
			});
		});
});

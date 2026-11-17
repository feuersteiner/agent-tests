import { describe, expect, test } from 'bun:test';
import { AssertOrchestrator } from '../../src/assert/index.ts';
import { createGlobEngine } from '../../src/engines/glob.ts';
import { createGrepEngine } from '../../src/engines/grep.ts';
import { EvalOrchestrator } from '../../src/eval/index.ts';
import { ScopeOrchestrator } from '../../src/scope/index.ts';
import { SelectOrchestrator } from '../../src/select/index.ts';
import { stubEngines } from '../helpers/engines.ts';
import { testFolder, validConfig, validTest } from '../helpers/fixtures.ts';
import { inTempDir } from '../helpers/temp.ts';
import type { EngineCall } from '../helpers/engines.ts';
import type { AgentTestEvalResult, AgentTestOutcome } from '../../src/eval/types.ts';
import type { AgentTestDefinition } from '../../src/loader/types.ts';

/** The eval folder, as the loader gives its root: relative to the repository root. */
const ROOT = '.agents/tests/no-todo/evals/clean';

interface EvalRun {
	result: AgentTestEvalResult;
	calls: EngineCall[];
}

/** Runs the Test on an eval folder holding `files`, with real scope, select, and assert orchestrators and stub engines: glob and grep real, decide and reason rejecting. */
const runEval = async (
	files: Record<string, string>,
	{
		test = validTest(),
		expected = 'pass',
		ignore = validConfig().ignore
	}: { test?: AgentTestDefinition; expected?: AgentTestOutcome; ignore?: string[] } = {}
): Promise<EvalRun> => {
	const glob = createGlobEngine();
	const grep = createGrepEngine();
	const { engines, calls } = stubEngines({ glob, grep });
	const config = validConfig();
	const orchestrator = new EvalOrchestrator(
		new ScopeOrchestrator(ignore),
		new SelectOrchestrator(engines, config.select),
		new AssertOrchestrator(engines, config.assert)
	);
	return inTempDir(testFolder(test, { clean: { expect: expected, files } }), async () => {
		const result = await orchestrator.run(test, { id: 'clean', root: ROOT, expect: expected });
		return { result, calls };
	});
};

/** The inputs one engine received, sorted. */
const inputsOf = (calls: EngineCall[], engine: EngineCall['engine']): string[] =>
	calls
		.filter((call) => call.engine === engine)
		.map((call) => call.input)
		.sort();

/** Each finding as its source path and assertion id. */
const toPairs = (result: AgentTestEvalResult): string[][] =>
	result.findings.map(({ source, assertion }) => [source.path, assertion.id]);

describe('EvalOrchestrator', () => {
	test('actual is skip when nothing is selected, and the assert engines are never called', async () => {
		const { result, calls } = await runEval({ 'README.md': 'TODO\n', 'lib/a.js': 'TODO\n' });
		expect(result.actual).toBe('skip');
		expect(result.findings).toEqual([]);
		expect(calls.filter((call) => call.engine !== 'glob')).toEqual([]);
	});

	test('actual is fail when there is a finding', async () => {
		const { result } = await runEval({ 'src/a.ts': '// TODO\n', 'src/b.ts': 'ok\n' });
		expect(result.actual).toBe('fail');
	});

	test('actual is pass when something is selected and there is no finding', async () => {
		const { result, calls } = await runEval({ 'src/a.ts': 'ok\n' });
		expect(inputsOf(calls, 'grep')).toEqual(['ok\n']);
		expect(result.actual).toBe('pass');
	});

	test.each([
		['pass', { 'src/a.ts': 'ok\n' }, true],
		['fail', { 'src/a.ts': 'ok\n' }, false],
		['skip', { 'src/a.ts': 'ok\n' }, false],
		['fail', { 'src/a.ts': '// TODO\n' }, true],
		['pass', { 'src/a.ts': '// TODO\n' }, false],
		['skip', { 'README.md': 'ok\n' }, true],
		['pass', { 'README.md': 'ok\n' }, false]
	] as [AgentTestOutcome, Record<string, string>, boolean][])(
		'matches only when actual equals expect %s (case %#)',
		async (expected, files, matches) => {
			const { result } = await runEval(files, { expected });
			expect(result.matches).toBe(matches);
			expect(result.eval.expect).toBe(expected);
		}
	);

	test('the eval.yaml at the eval root is not a source, while a nested eval.yaml is', async () => {
		const yamlTest = validTest({
			select: { glob: '**/eval.yaml' },
			assert: [{ id: 'no-expect', description: 'No expect.', error: 'Expect.', grep: 'expect' }]
		});
		const { result, calls } = await runEval(
			{ 'nested/eval.yaml': 'expect: pass\n' },
			{ test: yamlTest }
		);
		expect(inputsOf(calls, 'glob')).toEqual(['nested', 'nested/eval.yaml']);
		expect(toPairs(result)).toEqual([['nested/eval.yaml', 'no-expect']]);
	});

	test('the paths the Test globs see are relative to the eval folder', async () => {
		const { result, calls } = await runEval({ 'src/a.ts': 'ok\n', 'src/lib/b.ts': 'ok\n' });
		expect(inputsOf(calls, 'glob')).toEqual(['src', 'src/a.ts', 'src/lib', 'src/lib/b.ts']);
		expect(result.actual).toBe('pass');
	});

	test('returns the eval and the findings, by source then assertion', async () => {
		const twoAssertions = validTest({
			assert: [
				...validTest().assert,
				{ id: 'no-fixme', description: 'No FIXME.', error: 'Remove the FIXME.', grep: 'FIXME' }
			]
		});
		const files = { 'src/a.ts': '// TODO FIXME\n', 'src/b.ts': 'ok\n', 'src/c.ts': '// TODO\n' };
		const { result } = await runEval(files, { test: twoAssertions, expected: 'fail' });
		expect(result.eval).toEqual({ id: 'clean', root: ROOT, expect: 'fail' });
		expect(toPairs(result)).toEqual([
			['src/a.ts', 'no-todo'],
			['src/a.ts', 'no-fixme'],
			['src/c.ts', 'no-todo']
		]);
	});

	test.each([
		['a custom glob', ['src/generated/**'], 'src/generated/a.ts'],
		['the default ignore', validConfig().ignore, 'src/node_modules/a.ts']
	])('the config ignore globs apply inside the eval folder: %s', async (_, ignore, ignored) => {
		const files = { 'src/a.ts': 'ok\n', [ignored]: '// TODO\n' };
		const { result, calls } = await runEval(files, { ignore });
		expect(inputsOf(calls, 'glob')).not.toContain(ignored);
		expect(result.findings).toEqual([]);
		expect(result.actual).toBe('pass');
	});
});

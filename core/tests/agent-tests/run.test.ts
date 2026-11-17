import { describe, expect, test } from 'bun:test';
import { StubAgentTests } from '../helpers/agent-tests.ts';
import { stubEngines } from '../helpers/engines.ts';
import { testFolder, toYaml, validConfig, validTest } from '../helpers/fixtures.ts';
import { git, inTempRepo } from '../helpers/git.ts';
import { writeFiles } from '../helpers/temp.ts';
import type { AgentTestResult } from '../../src/assert/types.ts';
import type { AgentTestScope } from '../../src/scope/types.ts';

/** Each result as its Test id and the paths of its findings, in order. */
const summarize = (results: AgentTestResult[]): { id: string; paths: string[] }[] =>
	results.map(({ test, findings }) => ({
		id: test.id,
		paths: findings.map(({ source }) => source.path)
	}));

const noTodo = validTest();
const noFixme = validTest({
	id: 'no-fixme',
	title: 'No FIXME',
	assert: [{ id: 'no-fixme', description: 'No FIXME.', error: 'Fix it.', grep: 'FIXME' }]
});

/** Two Tests and two sources, each failing one of them. */
const twoTests = {
	...testFolder(noTodo),
	...testFolder(noFixme),
	'src/todo.ts': '// TODO',
	'src/fixme.ts': '// FIXME'
};

describe('AgentTests.run', () => {
	test('returns one result per Test, sorted by Test folder name, with its findings', async () => {
		await inTempRepo(twoTests, async () => {
			const results = await new StubAgentTests(validConfig()).run({ kind: 'all' });
			expect(results.map(({ test }) => test)).toEqual([noFixme, noTodo]);
			expect(summarize(results)).toEqual([
				{ id: 'no-fixme', paths: ['src/fixme.ts'] },
				{ id: 'no-todo', paths: ['src/todo.ts'] }
			]);
		});
	});

	test('runs only the Test named by id', async () => {
		await inTempRepo(twoTests, async () => {
			const results = await new StubAgentTests(validConfig()).run({ kind: 'all' }, 'no-fixme');
			expect(summarize(results)).toEqual([{ id: 'no-fixme', paths: ['src/fixme.ts'] }]);
		});
	});

	test('throws on an unknown id', async () => {
		await inTempRepo(twoTests, async () => {
			const run = new StubAgentTests(validConfig()).run({ kind: 'all' }, 'missing');
			await expect(run).rejects.toThrow('Unknown test: missing');
		});
	});

	test('throws one error listing every invalid test.yaml', async () => {
		const files = {
			...testFolder(noTodo),
			'.agents/tests/broken/test.yaml': toYaml({ version: 1, id: 'broken' }),
			'.agents/tests/mismatch/test.yaml': toYaml(validTest({ id: 'other' }))
		};
		await inTempRepo(files, async () => {
			const run = new StubAgentTests(validConfig()).run({ kind: 'all' });
			await expect(run).rejects.toThrow('2 of 3 test(s) invalid:');
			const error = await run.catch((caught: Error) => caught.message);
			expect(error).toContain('.agents/tests/broken/test.yaml');
			expect(error).toContain('.agents/tests/mismatch/test.yaml');
			expect(error).not.toContain('.agents/tests/no-todo/test.yaml');
		});
	});

	test('drives a select decide and an assert decide entirely through the stubs', async () => {
		const select = 'Is it kept?';
		const assert = 'Is it good?';
		const definition = validTest({
			select: { decide: select },
			assert: [{ id: 'is-good', description: 'Good.', error: 'Make it good.', decide: assert }]
		});
		const { engines, calls } = stubEngines({
			decide: (input, criteria) =>
				criteria === select ? Number(input.includes('keep')) : Number(input.includes('good'))
		});
		const files = {
			...testFolder(definition),
			'a.ts': 'keep bad',
			'b.ts': 'keep good',
			'c.ts': 'skip'
		};
		await inTempRepo(files, async () => {
			const results = await new StubAgentTests(validConfig(), { decide: engines.decide }).run({
				kind: 'all'
			});
			expect(summarize(results)).toEqual([{ id: 'no-todo', paths: ['a.ts'] }]);
		});
		const inputs = (criteria: string): string[] =>
			calls.filter((call) => call.criteria === criteria).map(({ input }) => input);
		expect(calls.every(({ engine }) => engine === 'decide')).toBe(true);
		expect(inputs(select).sort()).toEqual(['keep bad', 'keep good', 'skip']);
		expect(inputs(assert).sort()).toEqual(['keep bad', 'keep good']);
	});

	test.each([
		['all', { kind: 'all' }, ['src/committed.ts', 'src/staged.ts']],
		['staged', { kind: 'staged' }, ['src/staged.ts']]
	] as [string, AgentTestScope, string[]][])(
		'limits the sources to the %s scope',
		async (_, scope, paths) => {
			const files = { ...testFolder(noTodo), 'src/committed.ts': '// TODO', 'src/staged.ts': '' };
			await inTempRepo(files, async (dir) => {
				writeFiles(dir, { 'src/staged.ts': '// TODO' });
				git(dir, 'add', 'src/staged.ts');
				const results = await new StubAgentTests(validConfig()).run(scope);
				expect(summarize(results)).toEqual([{ id: 'no-todo', paths }]);
			});
		}
	);

	test.each([
		['the default ignore', validConfig(), ['src/a.ts']],
		['an empty ignore', validConfig({ ignore: [] }), ['.agents/helper.ts', 'src/a.ts']]
	])('takes files under .agents as sources only without %s', async (_, config, paths) => {
		const definition = validTest({ select: { glob: '**/*.ts' } });
		const files = {
			...testFolder(definition),
			'.agents/helper.ts': '// TODO',
			'src/a.ts': '// TODO'
		};
		await inTempRepo(files, async () => {
			const results = await new StubAgentTests(config).run({ kind: 'all' });
			expect(summarize(results)).toEqual([{ id: 'no-todo', paths }]);
		});
	});
});

import { describe, expect, test } from 'bun:test';
import { SelectOrchestrator } from '../../src/select/index.ts';
import { InMemorySource, Source } from '../../src/sources/index.ts';
import { stubEngines } from '../helpers/engines.ts';
import type { AgentTestEngines } from '../../src/engines/types.ts';
import type { AgentTestSelect } from '../../src/select/types.ts';
import type { EngineCall } from '../helpers/engines.ts';

/** A source that counts how often its content is opened. */
class CountingSource extends Source {
	public readonly kind = 'file';
	public opens = 0;

	constructor(
		path: string,
		private readonly content: string
	) {
		super(path);
	}

	public readonly open = (): string => {
		this.opens += 1;
		return this.content;
	};
}

/** The engines called, in order. */
const enginesCalled = (calls: EngineCall[]): string[] => calls.map((call) => call.engine);

/** The paths of the selected sources. */
const pathsOf = (sources: Source[]): string[] => sources.map((source) => source.path);

const selectWith = (engines: AgentTestEngines, threshold = 0.5): SelectOrchestrator =>
	new SelectOrchestrator(engines, { threshold });

const sources = (): InMemorySource[] => [
	new InMemorySource('src/c.ts', 'content c'),
	new InMemorySource('src/a.ts', 'content a'),
	new InMemorySource('src/b.ts', 'content b')
];

const all: AgentTestSelect = { glob: 'src/**/*.ts', grep: 'TODO', decide: 'Is it a service?' };

describe('SelectOrchestrator', () => {
	test('keeps every source in input order and calls no engine when the Test has no select', async () => {
		const { engines, calls } = stubEngines();
		const selected = await selectWith(engines).run(undefined, sources());
		expect(pathsOf(selected)).toEqual(['src/c.ts', 'src/a.ts', 'src/b.ts']);
		expect(calls).toEqual([]);
	});

	test('glob receives the path, grep and decide receive the content, each with its criteria', async () => {
		const { engines, calls } = stubEngines({ glob: () => 1, grep: () => 1, decide: () => 1 });
		await selectWith(engines).run(all, [new InMemorySource('src/a.ts', 'content a')]);
		expect(calls).toEqual([
			{ engine: 'glob', input: 'src/a.ts', criteria: 'src/**/*.ts' },
			{ engine: 'grep', input: 'content a', criteria: 'TODO' },
			{ engine: 'decide', input: 'content a', criteria: 'Is it a service?' }
		]);
	});

	test.each([
		['all pass', 1, 1, 1, true],
		['glob fails', 0, 1, 1, false],
		['grep fails', 1, 0, 1, false],
		['decide fails', 1, 1, 0, false]
	])(
		'selects a source only when every filter present passes: %s',
		async (_, glob, grep, decide, kept) => {
			const { engines } = stubEngines({ glob: () => glob, grep: () => grep, decide: () => decide });
			const selected = await selectWith(engines).run(all, [new InMemorySource('src/a.ts', 'a')]);
			expect(pathsOf(selected)).toEqual(kept ? ['src/a.ts'] : []);
		}
	);

	test.each([
		['glob', { glob: 'src/*.ts' }, ['glob']],
		['grep', { grep: 'TODO' }, ['grep']],
		['decide', { decide: 'Is it a service?' }, ['decide']],
		['glob and decide', { glob: 'src/*.ts', decide: 'Is it a service?' }, ['glob', 'decide']]
	] as [string, AgentTestSelect, string[]][])(
		'runs only the filters the select names: %s',
		async (_, select, engineNames) => {
			const { engines, calls } = stubEngines({ glob: () => 1, grep: () => 1, decide: () => 1 });
			const selected = await selectWith(engines).run(select, [new InMemorySource('src/a.ts', 'a')]);
			expect(pathsOf(selected)).toEqual(['src/a.ts']);
			expect(enginesCalled(calls)).toEqual(engineNames);
		}
	);

	test.each([
		['glob fails', 0, 1, ['glob']],
		['grep finds nothing', 1, 0, ['glob', 'grep']],
		['all pass', 1, 1, ['glob', 'grep', 'decide']]
	])(
		'runs glob, then grep, then decide, and stops at the first failure: %s',
		async (_, glob, grep, engineNames) => {
			const { engines, calls } = stubEngines({
				glob: () => glob,
				grep: () => grep,
				decide: () => 1
			});
			await selectWith(engines).run(all, [new InMemorySource('src/a.ts', 'a')]);
			expect(enginesCalled(calls)).toEqual(engineNames);
		}
	);

	test('a source failing one filter never reaches the later engines while the others go on', async () => {
		const { engines, calls } = stubEngines({
			glob: (path) => (path === 'src/a.ts' ? 0 : 1),
			grep: (content) => (content === 'content b' ? 0 : 1),
			decide: () => 1
		});
		const selected = await selectWith(engines).run(all, sources());
		expect(pathsOf(selected)).toEqual(['src/c.ts']);
		const inputsOf = (engine: string): string[] =>
			calls.filter((call) => call.engine === engine).map((call) => call.input);
		expect(inputsOf('glob')).toEqual(['src/c.ts', 'src/a.ts', 'src/b.ts']);
		expect(inputsOf('grep')).toEqual(['content c', 'content b']);
		expect(inputsOf('decide')).toEqual(['content c']);
	});

	test.each([
		['only glob is selected for and it passes', { glob: 'src/*.ts' }, 1, 0],
		['glob fails before grep', { glob: 'src/*.ts', grep: 'TODO' }, 0, 0],
		['glob fails before decide', { glob: 'src/*.ts', decide: 'Is it a service?' }, 0, 0]
	] as [string, AgentTestSelect, number, number][])(
		'does not open the content unless grep or decide is reached: %s',
		async (_, select, glob, opens) => {
			const { engines } = stubEngines({ glob: () => glob, grep: () => 1, decide: () => 1 });
			const source = new CountingSource('src/a.ts', 'a');
			await selectWith(engines).run(select, [source]);
			expect(source.opens).toBe(opens);
		}
	);

	test.each([
		['grep', { grep: 'TODO' }],
		['decide', { decide: 'Is it a service?' }]
	] as [string, AgentTestSelect][])('opens the content when %s is reached', async (_, select) => {
		const { engines } = stubEngines({ grep: () => 1, decide: () => 1 });
		const source = new CountingSource('src/a.ts', 'a');
		await selectWith(engines).run(select, [source]);
		expect(source.opens).toBeGreaterThan(0);
	});

	test.each([
		[0.5, true],
		[0.49, false]
	])('decide at the threshold 0.5 with score %p selects: %p', async (score, kept) => {
		const { engines } = stubEngines({ decide: () => score });
		const selected = await selectWith(engines, 0.5).run({ decide: 'Is it a service?' }, [
			new InMemorySource('src/a.ts', 'a')
		]);
		expect(pathsOf(selected)).toEqual(kept ? ['src/a.ts'] : []);
	});

	test.each([
		[0.6, true],
		[0.8, false]
	])(
		'takes the threshold from the config: score 0.7 at threshold %p selects: %p',
		async (threshold, kept) => {
			const { engines } = stubEngines({ decide: () => 0.7 });
			const selected = await selectWith(engines, threshold).run({ decide: 'Is it a service?' }, [
				new InMemorySource('src/a.ts', 'a')
			]);
			expect(pathsOf(selected)).toEqual(kept ? ['src/a.ts'] : []);
		}
	);

	test('keeps input order among many sources whose engines finish out of order', async () => {
		const many = Array.from(
			{ length: 20 },
			(_, index) => new InMemorySource(`src/${index}.ts`, `${index}`)
		);
		const { engines } = stubEngines({
			decide: async (content) => {
				const index = Number(content);
				await new Promise((resolve) => setTimeout(resolve, 20 - index));
				return index % 3 === 0 ? 0 : 1;
			}
		});
		const selected = await selectWith(engines).run({ decide: 'Is it a service?' }, many);
		const expected = many.filter((_, index) => index % 3 !== 0).map((source) => source.path);
		expect(pathsOf(selected)).toEqual(expected);
	});
});

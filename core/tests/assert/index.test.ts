import { describe, expect, test } from 'bun:test';
import { AssertOrchestrator } from '../../src/assert/index.ts';
import { InMemorySource } from '../../src/sources/index.ts';
import { stubEngines } from '../helpers/engines.ts';
import type { EngineCall } from '../helpers/engines.ts';
import type { AgentTestAssertion, AgentTestFinding } from '../../src/assert/types.ts';
import type { AgentTestEngines } from '../../src/engines/types.ts';

const THRESHOLD = 0.7;

/** An assertion with the given stages. */
const toAssertion = (overrides: Partial<AgentTestAssertion> = {}): AgentTestAssertion => ({
	id: 'check',
	description: 'The file passes the check.',
	error: 'Fix the file.',
	...overrides
});

/** An orchestrator over the engines with the test threshold. */
const toOrchestrator = (engines: AgentTestEngines): AssertOrchestrator =>
	new AssertOrchestrator(engines, { threshold: THRESHOLD });

/** Each finding as its source path and assertion id. */
const toPairs = (findings: AgentTestFinding[]): string[][] =>
	findings.map(({ source, assertion }) => [source.path, assertion.id]);

const source = new InMemorySource('src/a.ts', 'const a = 1; // TODO');

describe('AssertOrchestrator.run', () => {
	test('a source failing every stage present gives one finding', async () => {
		const { engines } = stubEngines({ grep: () => 1, decide: () => 0, reason: () => 0 });
		const assertion = toAssertion({ grep: 'TODO', decide: 'Is it done?', reason: 'Is it done?' });
		const findings = await toOrchestrator(engines).run([assertion], [source]);
		expect(toPairs(findings)).toEqual([['src/a.ts', 'check']]);
	});

	test.each([
		[0, 0],
		[1, 1],
		[3, 1]
	])(
		'grep scoring %p gives %p finding(s): it fails on at least one match',
		async (score, count) => {
			const { engines } = stubEngines({ grep: () => score });
			const findings = await toOrchestrator(engines).run([toAssertion({ grep: 'TODO' })], [source]);
			expect(findings).toHaveLength(count);
		}
	);

	describe.each(['decide', 'reason'] as const)('%s', (stage) => {
		test.each([
			[0, 1],
			[0.69, 1],
			[THRESHOLD, 0],
			[1, 0]
		])(
			'scoring %p gives %p finding(s): it fails strictly below the threshold',
			async (score, count) => {
				const { engines } = stubEngines({ [stage]: () => score });
				const assertion = toAssertion({ [stage]: 'Is it done?' });
				const findings = await toOrchestrator(engines).run([assertion], [source]);
				expect(findings).toHaveLength(count);
			}
		);
	});

	test.each<[string, number, number, number, EngineCall['engine'][]]>([
		['grep clears', 0, 0, 0, ['grep']],
		['decide clears', 1, 1, 0, ['grep', 'decide']],
		['reason clears', 1, 0, 1, ['grep', 'decide', 'reason']],
		['nothing clears', 1, 0, 0, ['grep', 'decide', 'reason']]
	])(
		'stages run grep, decide, reason and stop at the first that clears: %s',
		async (_, grep, decide, reason, called) => {
			const { engines, calls } = stubEngines({
				grep: () => grep,
				decide: () => decide,
				reason: () => reason
			});
			const assertion = toAssertion({
				grep: 'TODO',
				decide: 'Is it done?',
				reason: 'Is it right?'
			});
			await toOrchestrator(engines).run([assertion], [source]);
			expect(calls.map(({ engine }) => engine)).toEqual(called);
		}
	);

	test('each stage receives the source content and its own criteria', async () => {
		const { engines, calls } = stubEngines({ grep: () => 1, decide: () => 0, reason: () => 0 });
		const assertion = toAssertion({ grep: 'TODO', decide: 'Is it done?', reason: ['A', 'B'] });
		await toOrchestrator(engines).run([assertion], [source]);
		expect(calls).toEqual([
			{ engine: 'grep', input: source.open(), criteria: 'TODO' },
			{ engine: 'decide', input: source.open(), criteria: 'Is it done?' },
			{ engine: 'reason', input: source.open(), criteria: ['A', 'B'] }
		]);
	});

	test.each(['grep', 'decide', 'reason'] as const)(
		'an assertion with only %s calls that engine alone and fails on it',
		async (stage) => {
			const { engines, calls } = stubEngines({ [stage]: () => (stage === 'grep' ? 1 : 0) });
			const findings = await toOrchestrator(engines).run(
				[toAssertion({ [stage]: 'TODO' })],
				[source]
			);
			expect(calls.map(({ engine }) => engine)).toEqual([stage]);
			expect(findings).toHaveLength(1);
		}
	);

	test('several assertions on several sources give findings ordered by source, then assertion', async () => {
		const sources = [
			new InMemorySource('a.ts', 'TODO FIXME'),
			new InMemorySource('b.ts', 'clean'),
			new InMemorySource('c.ts', 'FIXME TODO')
		];
		const assertions = [
			toAssertion({ id: 'no-todo', grep: 'TODO' }),
			toAssertion({ id: 'no-fixme', grep: 'FIXME' })
		];
		const { engines } = stubEngines({
			grep: async (input, criteria) => {
				// Later sources finish first, so the order cannot come from completion.
				await Bun.sleep(input === 'TODO FIXME' ? 10 : 0);
				return input.includes(String(criteria)) ? 1 : 0;
			}
		});
		const findings = await toOrchestrator(engines).run(assertions, sources);
		expect(toPairs(findings)).toEqual([
			['a.ts', 'no-todo'],
			['a.ts', 'no-fixme'],
			['c.ts', 'no-todo'],
			['c.ts', 'no-fixme']
		]);
	});

	test('each finding carries the source and the assertion it failed', async () => {
		const { engines } = stubEngines({ grep: () => 1 });
		const assertion = toAssertion({ grep: 'TODO' });
		const [finding] = await toOrchestrator(engines).run([assertion], [source]);
		expect(finding?.source).toBe(source);
		expect(finding?.assertion).toBe(assertion);
	});

	test('an empty source list gives no findings and calls no engine', async () => {
		const { engines, calls } = stubEngines({ grep: () => 1 });
		const findings = await toOrchestrator(engines).run([toAssertion({ grep: 'TODO' })], []);
		expect(findings).toEqual([]);
		expect(calls).toEqual([]);
	});
});

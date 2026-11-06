import { describe, expect, it, vi } from 'vitest';
import { TestCheck } from '../src/check/index.ts';
import { TestTrigger } from '../src/trigger/index.ts';
import { TestEval } from '../src/evals/index.ts';
import { StubAIEngine } from './support.ts';
import { Source } from '../src/shared/source.ts';
import { parseYaml } from '../src/config/parse.ts';
import { validateTest } from '../src/config/validate.ts';
import { yaml } from './support.ts';
const parseTest = (text: string) => validateTest(parseYaml(text));

const source = (path: string, text: string) => new Source(path, async () => text);
describe('selection, escalation, evidence, and evals', () => {
	it('short-circuits filters and applies OR between triggers in result order', async () => {
		const ai = new StubAIEngine(0.9);
		const ask = vi.spyOn(ai, 'run');
		const read = vi.fn(async () => 'hello');
		const excluded = new Source('src/internal.ts', read);
		const definition = parseTest(yaml);
		const trigger = new TestTrigger(
			[{ ...definition.triggers![0]!, grep: 'hello', ask: ['first', 'second'] }],
			{ ai: { decide: ai, reason: ai }, threshold: 0.7 }
		);
		await trigger.run([excluded]);
		expect(read).not.toHaveBeenCalled();
		expect(ask).not.toHaveBeenCalled();
		const sources = [source('src/help/b.md', 'hello'), source('src/help/a.md', 'hello')];
		const result = await trigger.run(sources);
		expect(trigger.selected(sources, result)).toEqual(sources);
		expect(ask).toHaveBeenCalledTimes(2);
		expect(
			new TestTrigger([], { ai: { decide: ai, reason: ai }, threshold: 0.7 }).selected(sources, {
				flagged: [],
				cleared: []
			})
		).toEqual(sources);
	});
	it('lets later rules clear candidates and explains only final failures', async () => {
		const decisionAi = new StubAIEngine(0.1, [{ quote: 'gonna' }]);
		const reasoningAi = new StubAIEngine(0.9);
		const explain = vi.spyOn(decisionAi, 'explain');
		const rule = parseTest(yaml).checks[0]!;
		const checks = new TestCheck([{ ...rule, ask: 'Formal prose', reason: 'Formal prose' }], {
			ai: { decide: decisionAi, reason: reasoningAi },
			threshold: 0.7
		});
		expect((await checks.run([source('a.md', 'gonna')])).flagged).toHaveLength(0);
		expect(explain).not.toHaveBeenCalled();
		const final = new TestCheck([{ ...rule, ask: 'Formal prose' }], checks.config);
		const result = await final.run([source('a.md', 'okay\r\ngonna\rgonna')]);
		expect(result.flagged[0]!.findings?.map(({ line, column }) => [line, column])).toEqual([
			[2, 1],
			[3, 1]
		]);
		expect(explain).toHaveBeenCalledTimes(1);
	});
	it('grounds every grep occurrence and rejects invented AI quotes and invalid scores', async () => {
		const ai = new StubAIEngine(0.1);
		const checks = new TestCheck(parseTest(yaml).checks, {
			ai: { decide: ai, reason: ai },
			threshold: 0.7
		});
		const result = await checks.run([source('a.md', 'gonna gonna\ngonna')]);
		expect(result.flagged[0]!.findings?.map(({ line, column }) => [line, column])).toEqual([
			[1, 1],
			[1, 7],
			[2, 1]
		]);
		await expect(new StubAIEngine(1.1).run({ input: 'a', ask: 'passes' })).rejects.toThrow();
		await expect(
			new StubAIEngine(0.1, [{ quote: 'invented' }]).explain(
				{ input: 'actual', ask: 'passes' },
				0.1
			)
		).rejects.toThrow('absent');
	});
	it('records pass, fail, skip and flags mismatched labels', async () => {
		const definition = parseTest(yaml);
		const ai = new StubAIEngine(0.9);
		const trigger = new TestTrigger(definition.triggers!, {
			ai: { decide: ai, reason: ai },
			threshold: 0.7
		});
		const check = new TestCheck(definition.checks, {
			ai: { decide: ai, reason: ai },
			threshold: 0.7
		});
		const examples = [
			...definition.evals,
			{ ...definition.evals[0]!, name: 'wrong', expect: 'pass' as const }
		];
		const result = await new TestEval(examples).run(trigger, check);
		expect(result.cleared.map((entry) => entry.actual).sort()).toEqual(['fail', 'pass', 'skip']);
		expect(result.flagged[0]!.trace).toContain('expected pass, got fail');
	});
});

import { describe, expect, it, vi } from 'vitest';
import { TestCheck } from '../src/check/index.ts';
import { TestTrigger } from '../src/trigger/index.ts';
import { TestEval } from '../src/evals/index.ts';
import { StubAI } from '../src/shared/ai/stub.ts';
import { Source } from '../src/shared/source.ts';
import { Parser } from '../cli/parser.ts';
import { yaml } from './support.ts';

const source = (path: string, text: string) => new Source(path, async () => text);
describe('selection, escalation, evidence, and evals', () => {
	it('short-circuits filters and applies OR between triggers in input order', async () => {
		const ai = new StubAI(0.9);
		const ask = vi.spyOn(ai, 'run');
		const read = vi.fn(async () => 'hello');
		const excluded = new Source('src/internal.ts', read);
		const definition = new Parser().run(yaml);
		const trigger = new TestTrigger(
			[{ ...definition.triggers![0]!, grep: 'hello', ask: ['first', 'second'] }],
			{ ai, threshold: 0.7 }
		);
		await trigger.run([excluded]);
		expect(read).not.toHaveBeenCalled();
		expect(ask).not.toHaveBeenCalled();
		const sources = [source('src/help/b.md', 'hello'), source('src/help/a.md', 'hello')];
		const result = await trigger.run(sources);
		expect(trigger.selected(sources, result)).toEqual(sources);
		expect(ask).toHaveBeenCalledTimes(2);
		expect(
			new TestTrigger([], { ai, threshold: 0.7 }).selected(sources, { flagged: [], cleared: [] })
		).toEqual(sources);
	});
	it('lets later rules clear candidates and explains only final failures', async () => {
		const decisionAi = new StubAI(0.1, [{ quote: 'gonna' }]);
		const reasoningAi = new StubAI(0.9);
		const explain = vi.spyOn(decisionAi, 'explain');
		const rule = new Parser().run(yaml).checks[0]!;
		const checks = new TestCheck([{ ...rule, ask: 'Formal prose', reason: 'Formal prose' }], {
			decisionAi,
			reasoningAi,
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
		const ai = new StubAI(0.1);
		const checks = new TestCheck(new Parser().run(yaml).checks, {
			decisionAi: ai,
			reasoningAi: ai,
			threshold: 0.7
		});
		const result = await checks.run([source('a.md', 'gonna gonna\ngonna')]);
		expect(result.flagged[0]!.findings?.map(({ line, column }) => [line, column])).toEqual([
			[1, 1],
			[1, 7],
			[2, 1]
		]);
		await expect(new StubAI(1.1).run({ input: 'a', ask: 'passes' })).rejects.toThrow();
		await expect(
			new StubAI(0.1, [{ quote: 'invented' }]).explain({ input: 'actual', ask: 'passes' }, 0.1)
		).rejects.toThrow('absent');
	});
	it('records pass, fail, skip and flags mismatched labels', async () => {
		const definition = new Parser().run(yaml);
		const ai = new StubAI(0.9);
		const trigger = new TestTrigger(definition.triggers!, { ai, threshold: 0.7 });
		const check = new TestCheck(definition.checks, {
			decisionAi: ai,
			reasoningAi: ai,
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

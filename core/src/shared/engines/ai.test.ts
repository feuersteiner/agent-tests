import { expect, it, vi } from 'vitest';
import { AIEngine, providerSettings } from './ai.ts';
import type { AiExplanation } from './types.ts';

class StubEngine extends AIEngine {
	scoring = vi.fn(async () => 0.75);
	explaining = vi.fn(async (): Promise<AiExplanation> => ({
		score: 0.75,
		failures: [{ quote: 'text' }]
	}));
	protected override score = this.scoring;
	protected override evidence = this.explaining;
}

it('preserves bounded scores and honors an explicit empty system prompt', async () => {
	const engine = new StubEngine();
	expect(await engine.run({ input: 'text', ask: 'Pass.' }, { system: '' })).toBe(0.75);
	expect(engine.scoring).toHaveBeenCalledWith({ input: 'text', ask: 'Pass.' }, '');
	engine.scoring.mockResolvedValueOnce(2);
	await expect(engine.run({ input: 'text', ask: 'Pass.' })).rejects.toThrow();
});

it('rejects invalid requests and options before calling providers', async () => {
	const engine = new StubEngine();
	await expect(engine.run({ input: 'text', ask: ' ' })).rejects.toThrow();
	await expect(
		engine.run({ input: 'text', ask: 'Pass.' }, { extra: true } as never)
	).rejects.toThrow();
	expect(engine.scoring).not.toHaveBeenCalled();
});

it('does not rescore explanations and skips evidence for blank inputs', async () => {
	const engine = new StubEngine();
	expect(await engine.explain({ input: ' ', ask: 'Pass.' }, 0.25)).toEqual({
		score: 0.25,
		failures: []
	});
	expect(engine.explaining).not.toHaveBeenCalled();
	expect(await engine.explain({ input: 'text', ask: 'Pass.' }, 0.75)).toEqual({
		score: 0.75,
		failures: [{ quote: 'text' }]
	});
	expect(engine.scoring).not.toHaveBeenCalled();
});

it('rejects altered scores and evidence that is not an exact input quote', async () => {
	const engine = new StubEngine();
	await expect(engine.explain({ input: 'text', ask: 'Pass.' }, 0.5)).rejects.toThrow('changed');
	engine.explaining.mockResolvedValueOnce({ score: 0.75, failures: [{ quote: 'TEXT' }] });
	await expect(engine.explain({ input: 'text', ask: 'Pass.' }, 0.75)).rejects.toThrow('absent');
});

it('requires configured provider credentials', () => {
	vi.stubEnv('AGENT_TESTS_ENGINE_TEST_KEY', '');
	try {
		expect(() =>
			providerSettings({
				api: 'openai',
				url: 'https://example.com',
				model: 'model',
				apiKeyEnv: 'AGENT_TESTS_ENGINE_TEST_KEY'
			})
		).toThrow('Missing environment variable');
	} finally {
		vi.unstubAllEnvs();
	}
});

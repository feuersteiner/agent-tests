import { generateText } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAiDecisionModel, createMockModel } from './index.js';
import type { LanguageModel } from 'ai';

vi.mock('ai', () => ({ generateText: vi.fn(), Output: { object: vi.fn((value) => value) } }));
const generate = vi.mocked(generateText);
beforeEach(() => vi.clearAllMocks());

describe('mock decision models', () => {
	it('consumes ordered responses and fails explicitly on exhaustion', async () => {
		const model = createMockModel([{ decision: 'pass' }, { decision: 'unsure' }]);
		expect((await model.decide({ ask: 'First' })).decision).toBe('pass');
		expect((await model.decide({ ask: 'Second' })).decision).toBe('unsure');
		await expect(model.decide({ ask: 'Third' })).rejects.toThrow('no remaining responses');
	});

	it('supports request-aware async decisions', async () => {
		const model = createMockModel(async (request) => ({
			decision: request.content?.includes('hey') ? 'fail' : 'pass'
		}));
		expect((await model.decide({ ask: 'Formal?', content: 'hey' })).decision).toBe('fail');
	});
});

describe('AI SDK decision adapter', () => {
	it('requests structured judgment with evidence and reasoning', async () => {
		generate.mockResolvedValueOnce({
			output: {
				decision: 'fail',
				confidence: 0.9,
				message: 'Informal greeting',
				matches: [{ text: 'hey', line: 2, message: 'Informal' }]
			}
		} as unknown as Awaited<ReturnType<typeof generateText>>);
		const model = createAiDecisionModel('test' as LanguageModel);
		const result = await model.decide({
			ask: 'Formal English',
			content: 'hello\nhey',
			level: 'deep',
			reasoning: 'high'
		});
		expect(result.matches?.[0]?.line).toBe(2);
		expect(result.decision).toBe('fail');
		expect(generate).toHaveBeenCalledWith(
			expect.objectContaining({
				prompt: expect.stringContaining('Formal English'),
				providerOptions: { openai: { reasoningEffort: 'high' } },
				output: expect.anything(),
				maxRetries: 0
			})
		);
	});

	it('does not propagate provider error details or return a passing judgment', async () => {
		generate.mockRejectedValueOnce(new Error('Authorization: Bearer super-secret-key'));
		const model = createAiDecisionModel('test' as LanguageModel);
		await expect(model.decide({ ask: 'rule' })).rejects.toThrow('Decision model request failed');
		generate.mockRejectedValueOnce(new Error('super-secret-key'));
		await expect(model.decide({ ask: 'rule' })).rejects.not.toThrow('super-secret-key');
	});
});

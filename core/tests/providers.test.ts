import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDecisionAI, buildReasoningAI } from '../src/shared/ai/models.ts';
import { AgentTest } from '../src/index.ts';
import { Parser } from '../cli/parser.ts';
import { config, model, yaml } from './support.ts';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});
const request = { input: 'gonna', ask: 'Uses formal English' };
const setup = (reply: (url: string, body: any) => unknown) => {
	vi.stubEnv(model.apiKeyEnv, 'offline-fixture');
	const fetcher = vi.fn(async (url: string, init: RequestInit) => {
		expect(
			new Headers(init.headers).get('authorization') ?? new Headers(init.headers).get('x-api-key')
		).toBeTruthy();
		return Response.json(reply(String(url), JSON.parse(String(init.body))));
	});
	vi.stubGlobal('fetch', fetcher);
	return fetcher;
};
const typeSafeReply = (body: any) => ({
	model: body.model,
	answers: Object.fromEntries(
		Object.entries(body.questions).map(([id, question]: [string, any]) => [
			id,
			question.type === 'noul'
				? { type: 'noul', noul: 0.1 }
				: { type: 'choice', choice: 'fail', probabilities: { pass: 0.1, fail: 0.9 } }
		])
	)
});

describe('real SDK adapters with offline HTTP fixtures', () => {
	it.each(['jev', 'clef'] as const)(
		'scores and explains through %s without a gateway',
		async (api) => {
			const url =
				api === 'clef'
					? 'https://example.com/ai/run/@cf/cloudflare/clef'
					: 'https://example.com/v1';
			const fetcher = setup((target, body) => {
				expect(target).toBe(api === 'clef' ? url : `${url}/systemone`);
				return api === 'clef'
					? { success: true, result: typeSafeReply(body) }
					: typeSafeReply(body);
			});
			const ai = buildDecisionAI({ ...model, api, url });
			const score = await ai.run(request);
			expect(score).toBe(0.1);
			expect(await ai.explain(request, score)).toEqual({
				score: 0.1,
				failures: [{ quote: 'gonna' }]
			});
			expect(fetcher).toHaveBeenCalledTimes(2);
		}
	);
	it('batches long explanations within the Clef question limit without rescoring', async () => {
		const sizes: number[] = [];
		setup((_url, body) => {
			sizes.push(Object.keys(body.questions).length);
			if (Object.keys(body.questions).length > 64) throw new Error('Too many questions');
			return { success: true, result: typeSafeReply(body) };
		});
		const input = Array.from({ length: 65 }, (_, index) => `line ${index}`).join('\n');
		const ai = buildDecisionAI({ ...model, api: 'clef' });
		const result = await ai.explain({ ...request, input }, 0.1);
		expect(sizes).toEqual([64, 1]);
		expect(result.score).toBe(0.1);
		expect(result.failures).toHaveLength(65);
	});
	it('uses OpenAI Decisions and preserves probability and native choice answers', async () => {
		setup((url, body) => {
			expect(url).toBe('https://api.openai.com/v1/decisions');
			return {
				answers: body.questions.map((question: any) =>
					question.type === 'predicate'
						? { type: 'predicate', name: question.name, probability: 0.1 }
						: {
								type: 'choice',
								name: question.name,
								choice: 'fail',
								probabilities: [
									{ value: 'pass', probability: 0.1 },
									{ value: 'fail', probability: 0.9 }
								]
							}
				)
			};
		});
		const ai = buildDecisionAI(model);
		expect(await ai.run(request)).toBe(0.1);
		expect((await ai.explain(request, 0.1)).failures).toEqual([{ quote: 'gonna' }]);
	});
	it.each(['openai', 'anthropic'] as const)('uses structured %s reasoning output', async (api) => {
		let calls = 0;
		setup((url) => {
			const content = JSON.stringify(
				calls++ ? { reason: null, failures: [{ quote: 'gonna', reason: null }] } : { score: 0.1 }
			);
			if (api === 'openai') {
				expect(url).toBe('https://example.com/v1/chat/completions');
				return {
					id: 'offline',
					model: 'gpt-6-luna',
					choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }]
				};
			}
			expect(url).toBe('https://example.com/v1/messages');
			return {
				id: 'offline',
				type: 'message',
				role: 'assistant',
				model: 'claude-sonnet-4-6',
				content: [{ type: 'text', text: content }],
				stop_reason: 'end_turn',
				stop_sequence: null,
				usage: { input_tokens: 10, output_tokens: 10 }
			};
		});
		const ai = buildReasoningAI({
			...model,
			api,
			url: 'https://example.com/v1',
			model: api === 'anthropic' ? 'claude-sonnet-4-6' : model.model
		});
		expect(await ai.run(request)).toBe(0.1);
		expect((await ai.explain(request, 0.1)).failures).toEqual([{ quote: 'gonna' }]);
	});
	it('composes AgentTest with a real SDK and fails closed on a Clef error envelope', async () => {
		setup((_url, body) => typeSafeReply(body));
		const definition = new Parser().run(yaml);
		definition.checks[0]!.ask = 'Uses formal English';
		const test = new AgentTest([], definition, { ...config, decision: { ...model, api: 'jev' } });
		expect((await test.eval()).flagged.map((entry) => entry.check.name)).toEqual([]);
		setup(() => ({ success: false, errors: [{ message: 'refused' }] }));
		await expect(buildDecisionAI({ ...model, api: 'clef' }).run(request)).rejects.toThrow(
			'Clef rejected'
		);
	});
});

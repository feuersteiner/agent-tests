import { z } from 'zod';
import { decisionScore, score } from './criteria.ts';

const StateSchema = z.object({ input: z.string() });
const DecisionSchema = z.object({
	input: z.array(
		z.object({
			content: z.array(
				z.union([
					z.object({ type: z.literal('input_json'), data: StateSchema }),
					z.object({ type: z.literal('input_text'), text: z.string() })
				])
			)
		})
	),
	questions: z.array(z.object({ name: z.string(), instructions: z.string() }))
});
const ChatSchema = z.object({
	messages: z.array(z.object({ role: z.string(), content: z.string() }))
});
const RequestSchema = StateSchema.extend({ ask: z.string() });

/** Local SDK-compatible stub; only known fixture prompts are accepted. */
export const startModel = (): Bun.Server<undefined> =>
	Bun.serve({
		hostname: 'localhost',
		port: 0,
		async fetch(request: Request): Promise<Response> {
			const path = new URL(request.url).pathname;
			try {
				const body: unknown = await request.json();
				if (path === '/v1/decisions') {
					const data = DecisionSchema.parse(body);
					const part = data.input[0]?.content[0];
					if (!part) throw new Error('Missing fixture decision input');
					const state =
						part.type === 'input_json' ? part.data : StateSchema.parse(JSON.parse(part.text));
					return Response.json({
						answers: data.questions.map((question) => ({
							type: 'predicate',
							name: question.name,
							probability: decisionScore(state.input, question.instructions)
						}))
					});
				}
				if (path === '/v1/chat/completions') {
					const message = ChatSchema.parse(body).messages.find((entry) => entry.role === 'user');
					if (!message) throw new Error('Missing fixture chat input');
					const { input, ask } = RequestSchema.parse(JSON.parse(message.content));
					return Response.json({
						id: 'fixture',
						object: 'chat.completion',
						created: 0,
						model: 'fixture',
						choices: [
							{
								index: 0,
								message: {
									role: 'assistant',
									content: JSON.stringify({ score: score(input, ask) })
								},
								finish_reason: 'stop'
							}
						],
						usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
					});
				}
				return new Response('Unsupported fixture endpoint', { status: 404 });
			} catch (error: unknown) {
				console.error('Fixture model:', error);
				return Response.json(
					{ error: { message: String(error), type: 'fixture_error' } },
					{ status: 400 }
				);
			}
		}
	});

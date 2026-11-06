import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { AIEngine, providerSettings } from './index.ts';
import { AiExplanationSchema, FailInstanceSchema } from '../types.ts';
import type { AiRequest, AiSettings } from '../types.ts';

const ReasoningScoreSchema = AiExplanationSchema.pick({ score: true });
const ReasoningEvidenceSchema = AiExplanationSchema.omit({ score: true }).extend({
	reason: AiExplanationSchema.shape.reason.unwrap().nullable(),
	failures: FailInstanceSchema.extend({
		reason: FailInstanceSchema.shape.reason.unwrap().nullable()
	}).array()
});

/** Reason engine using one configured SDK model for scores and evidence. */
export class ReasonAIEngine extends AIEngine {
	protected readonly model: ReturnType<ReturnType<typeof createOpenAI>['chat']>;

	constructor(config: AiSettings['reasoning']) {
		super();
		const options = providerSettings(config);
		this.model =
			config.api === 'openai'
				? createOpenAI(options).chat(config.model)
				: createAnthropic(options)(config.model);
	}

	protected override async score({ input, ask, reasoning }: AiRequest, system: string) {
		const result = await generateText({
			model: this.model,
			reasoning,
			output: Output.object({ schema: ReasoningScoreSchema }),
			system,
			prompt: JSON.stringify({ input, ask })
		});
		return result.output.score;
	}

	protected override async evidence(
		{ input, ask, reasoning }: AiRequest,
		score: number,
		system: string
	) {
		const result = await generateText({
			model: this.model,
			reasoning,
			output: Output.object({ schema: ReasoningEvidenceSchema }),
			system,
			prompt: JSON.stringify({ input, ask, score })
		});
		const evidence = result.output;
		return {
			score,
			...(evidence.reason === null ? {} : { reason: evidence.reason }),
			failures: evidence.failures.map(({ quote, reason }) => ({
				quote,
				...(reason === null ? {} : { reason })
			}))
		};
	}
}

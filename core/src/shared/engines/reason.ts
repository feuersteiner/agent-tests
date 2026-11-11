import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { providerSettings } from './providers.ts';
import { RUN_SYSTEM_PROMPT } from './prompts.ts';
import { AiConfigSchema, InputSchema, ReasoningScoreSchema } from './types.ts';
import type { AiSettings, Engine } from './types.ts';
import { ParamSchema } from '../types.ts';

/** Returns the highest passing confidence, reusing a lazy provider and model. */
export const createReasonEngine = (settings: AiSettings['reasoning']): Engine => {
	const provider = { ...settings };
	let openai: ReturnType<typeof createOpenAI> | undefined;
	let anthropic: ReturnType<typeof createAnthropic> | undefined;
	let model: ReturnType<ReturnType<typeof createOpenAI>['chat']> | undefined;
	return async (input, criteria, config = {}) => {
		InputSchema.parse(input);
		const conditions = [ParamSchema.parse(criteria)].flat();
		const system = AiConfigSchema.parse(config).system ?? RUN_SYSTEM_PROMPT;
		const cachedModel = (model ??=
			provider.api === 'openai'
				? (openai ??= createOpenAI(providerSettings(provider))).chat(provider.model)
				: (anthropic ??= createAnthropic(providerSettings(provider)))(provider.model));
		const scores = await Promise.all(
			conditions.map(async (ask) => {
				const result = await generateText({
					model: cachedModel,
					output: Output.object({ schema: ReasoningScoreSchema }),
					system,
					prompt: JSON.stringify({ input, ask })
				});
				return ReasoningScoreSchema.parse(result.output).score;
			})
		);
		return Math.max(...scores);
	};
};

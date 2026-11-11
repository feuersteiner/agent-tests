import { createOpenAI } from '@ai-sdk/openai';
import { createTypeSafeAi } from '@ai-sdk/typesafe-ai';
import { experimental_decide } from 'ai';
import { providerSettings } from './providers.ts';
import { RUN_SYSTEM_PROMPT } from './prompts.ts';
import { AiConfigSchema, InputSchema, ScoreSchema } from './types.ts';
import type { AiSettings, Engine } from './types.ts';
import { ParamSchema } from '../types.ts';

/** Returns the highest passing probability, reusing a lazy provider and model. */
export const createDecideEngine = (settings: AiSettings['decision']): Engine => {
	const provider = { ...settings };
	let openai: ReturnType<typeof createOpenAI> | undefined;
	let typesafe: ReturnType<typeof createTypeSafeAi> | undefined;
	let model: ReturnType<ReturnType<typeof createOpenAI>['decisionModel']> | undefined;
	return async (input, criteria, config = {}) => {
		InputSchema.parse(input);
		const conditions = [ParamSchema.parse(criteria)].flat();
		const system = AiConfigSchema.parse(config).system ?? RUN_SYSTEM_PROMPT;
		const cachedModel = (model ??=
			provider.api === 'openai'
				? (openai ??= createOpenAI(providerSettings(provider))).decisionModel(provider.model)
				: (typesafe ??= createTypeSafeAi(providerSettings(provider))).decisionModel(
						provider.model
					));
		const scores = await Promise.all(
			conditions.map(async (ask) => {
				const result = await experimental_decide({
					model: cachedModel,
					state: { input },
					questions: {
						criterion: {
							type: 'boolean',
							instructions: [system, ask].filter((value) => value.length).join('\n\n')
						}
					}
				});
				return ScoreSchema.parse(result.answers.criterion.probability);
			})
		);
		return Math.max(...scores);
	};
};

import { createOpenAI } from '@ai-sdk/openai';
import { createTypeSafeAi } from '@ai-sdk/typesafe-ai';
import { experimental_decide } from 'ai';
import { providerSettings, RUN_SYSTEM_PROMPT } from './utils.ts';
import type { AgentTestDecisionConfig, AgentTestEngine } from './types.ts';

/** Returns the highest passing probability, reusing a lazy provider and model. */
export const createDecideEngine = (settings: AgentTestDecisionConfig): AgentTestEngine => {
	const provider = { ...settings };
	let openai: ReturnType<typeof createOpenAI> | undefined;
	let typesafe: ReturnType<typeof createTypeSafeAi> | undefined;
	let model: ReturnType<ReturnType<typeof createOpenAI>['decisionModel']> | undefined;
	return async (input, criteria) => {
		const conditions = [criteria].flat();
		const cachedModel = (model ??=
			provider.api === 'openai'
				? (openai ??= createOpenAI(providerSettings(provider))).decisionModel(provider.model)
				: (typesafe ??= createTypeSafeAi(providerSettings(provider))).decisionModel(
						provider.model
					));
		const scores = await Promise.all(
			conditions.map(async (criterion) => {
				const result = await experimental_decide({
					model: cachedModel,
					state: { input },
					questions: {
						criterion: {
							type: 'boolean',
							instructions: [RUN_SYSTEM_PROMPT, criterion].join('\n\n')
						}
					}
				});
				return result.answers.criterion.probability;
			})
		);
		return Math.max(...scores);
	};
};

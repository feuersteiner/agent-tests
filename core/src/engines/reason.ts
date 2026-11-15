import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { providerSettings, RUN_SYSTEM_PROMPT } from './utils.ts';
import { AgentTestReasoningOutputSchema } from '../types.ts';
import type { AgentTestConfig, AgentTestEngine } from '../types.ts';

/** Returns the highest passing confidence, reusing a lazy provider and model. */
export const createReasonEngine = (settings: AgentTestConfig['reasoning']): AgentTestEngine => {
	const provider = { ...settings };
	let openai: ReturnType<typeof createOpenAI> | undefined;
	let anthropic: ReturnType<typeof createAnthropic> | undefined;
	let model: ReturnType<ReturnType<typeof createOpenAI>['chat']> | undefined;
	return async (input, criteria) => {
		const conditions = [criteria].flat();
		const cachedModel = (model ??=
			provider.api === 'openai'
				? (openai ??= createOpenAI(providerSettings(provider))).chat(provider.model)
				: (anthropic ??= createAnthropic(providerSettings(provider)))(provider.model));
		const scores = await Promise.all(
			conditions.map(async (criterion) => {
				const result = await generateText({
					model: cachedModel,
					output: Output.object({ schema: AgentTestReasoningOutputSchema }),
					system: RUN_SYSTEM_PROMPT,
					prompt: JSON.stringify({ input, criterion })
				});
				return result.output.score;
			})
		);
		return Math.max(...scores);
	};
};

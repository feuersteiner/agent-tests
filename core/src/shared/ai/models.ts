import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createTypeSafeAi } from '@ai-sdk/typesafe-ai';
import { DecisionAI } from './decision.ts';
import { ReasoningAI } from './reasoning.ts';
import type { AiModelConfig } from './types.ts';

const settings = (config: AiModelConfig) => {
	const apiKey = process.env[config.apiKeyEnv];
	if (!apiKey?.trim()) throw new Error(`Missing environment variable: ${config.apiKeyEnv}`);
	return { apiKey, baseURL: config.url.replace(/\/$/, '') };
};

/** Build the decision model from validated config, resolving its required environment key. */
export const buildDecisionAI = (config: AiModelConfig): DecisionAI => {
	const options = settings(config);
	if (config.api === 'openai')
		return new DecisionAI(createOpenAI(options).decisionModel(config.model));
	if (config.api === 'jev')
		return new DecisionAI(createTypeSafeAi(options).decisionModel(config.model));
	throw new Error('Invalid decision API');
};

/** Build the structured-output model from validated config and its environment key. */
export const buildReasoningAI = (config: AiModelConfig): ReasoningAI => {
	const options = settings(config);
	if (config.api === 'openai') return new ReasoningAI(createOpenAI(options).chat(config.model));
	if (config.api === 'anthropic') return new ReasoningAI(createAnthropic(options)(config.model));
	throw new Error('Invalid reasoning API');
};

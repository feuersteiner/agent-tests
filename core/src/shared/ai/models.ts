import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { TypeSafeAiProviderSettings } from '@ai-sdk/typesafe-ai';
import { createTypeSafeAi } from '@ai-sdk/typesafe-ai';
import { DecisionAI } from './decision.ts';
import { ReasoningAI } from './reasoning.ts';
import type { AiModelConfig } from './types.ts';

const settings = (config: AiModelConfig) => {
	const apiKey = process.env[config.apiKeyEnv];
	if (!apiKey?.trim()) throw new Error(`Missing environment variable: ${config.apiKeyEnv}`);
	return { apiKey, baseURL: config.url.replace(/\/$/, '') };
};

/** Adapt the TypeSafe wire format to Cloudflare's exact endpoint and result envelope. */
const clefFetch = (url: string): NonNullable<TypeSafeAiProviderSettings['fetch']> =>
	Object.assign(
		async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
			const response = await globalThis.fetch(url, { ...init, redirect: 'error' });
			if (!response.ok) return response;
			const body = (await response.json()) as { success?: boolean; result?: unknown };
			if (body.success === false) throw new Error('Clef rejected the request');
			return Response.json(body.result ?? body, { status: response.status });
		},
		{ preconnect: globalThis.fetch.preconnect }
	);

/** Build the decision model from validated config, resolving its required environment key. */
export const buildDecisionAI = (config: AiModelConfig): DecisionAI => {
	const options = settings(config);
	if (config.api === 'openai')
		return new DecisionAI(createOpenAI(options).decisionModel(config.model));
	if (config.api !== 'jev' && config.api !== 'clef') throw new Error('Invalid decision API');
	const provider = createTypeSafeAi({
		...options,
		...(config.api === 'clef' ? { fetch: clefFetch(config.url) } : {})
	});
	return new DecisionAI(provider.decisionModel(config.model));
};

/** Build the structured-output model from validated config and its environment key. */
export const buildReasoningAI = (config: AiModelConfig): ReasoningAI => {
	const options = settings(config);
	if (config.api === 'openai') return new ReasoningAI(createOpenAI(options).chat(config.model));
	if (config.api === 'anthropic') return new ReasoningAI(createAnthropic(options)(config.model));
	throw new Error('Invalid reasoning API');
};

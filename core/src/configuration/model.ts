import { createOpenAI } from '@ai-sdk/openai';
import { createAiDecisionModel } from '../models/index.js';
import type { DecisionModel } from '../models/index.js';
import type { LoadedConfiguration } from './types.js';

/** Create the configured AI SDK adapter; absent credentials deliberately leave model checks disabled. */
export const createConfiguredModel = (loaded: LoadedConfiguration): DecisionModel | undefined => {
	const configuration = loaded.config.model;
	if (!configuration) return undefined;
	const apiKey = loaded.environment[configuration.apiKeyEnv ?? 'OPENAI_API_KEY'];
	if (!apiKey) return undefined;
	try {
		const provider = createOpenAI({
			apiKey,
			...(configuration.baseUrl ? { baseURL: configuration.baseUrl } : {})
		});
		const model =
			configuration.provider === 'openai-compatible'
				? provider.chat(configuration.model)
				: provider(configuration.model);
		return createAiDecisionModel(model);
	} catch {
		throw new Error('Cannot initialize the decision model; check provider configuration');
	}
};

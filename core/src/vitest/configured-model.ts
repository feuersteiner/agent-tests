import { createConfiguredModel, loadConfiguration } from '../configuration/index.js';
import type { DecisionModel } from '../models/index.js';
import { createCachedModel, modelIdentity } from './cache.js';

/** Load private credentials in the current process, sharing only fingerprinted cached answers. */
export const loadHostedModel = async (
	root: string,
	cacheDirectory: string
): Promise<DecisionModel | undefined> => {
	const loaded = await loadConfiguration(root);
	const configuration = loaded.config.model;
	const credential = loaded.environment[configuration?.apiKeyEnv ?? 'OPENAI_API_KEY'];
	return createCachedModel(
		createConfiguredModel(loaded),
		cacheDirectory,
		modelIdentity(configuration, credential)
	);
};

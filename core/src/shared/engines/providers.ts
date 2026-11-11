import type { AiModelConfig } from './types.ts';

/** Resolve provider credentials synchronously before any operation runs. */
export const providerSettings = (config: AiModelConfig) => {
	const apiKey = process.env[config.apiKeyEnv];
	if (!apiKey?.trim()) throw new Error(`Missing environment variable: ${config.apiKeyEnv}`);
	return { apiKey, baseURL: config.url.replace(/\/$/, '') };
};

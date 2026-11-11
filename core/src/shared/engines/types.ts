import { z } from 'zod';
import { TextSchema } from '../types.ts';
import type { Param } from '../types.ts';

export const InputSchema = z.string();
export const ScoreSchema = z.number().min(0).max(1);
export const ReasoningScoreSchema = z.strictObject({ score: ScoreSchema });

/** Optional system-instruction override; an empty string explicitly removes the default. */
export const AiConfigSchema = z.strictObject({
	system: z.string().optional()
});
export type AiConfig = z.infer<typeof AiConfigSchema>;

/** Explicit provider routing and an environment-variable reference, never a credential. */
export const AiModelConfigSchema = z.strictObject({
	api: z.enum(['openai', 'jev', 'anthropic']),
	url: z.url(),
	model: TextSchema,
	apiKeyEnv: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Expected an environment variable name')
});
export type AiModelConfig = z.infer<typeof AiModelConfigSchema>;

/** Validated provider settings needed by the service; stage settings belong to repository config. */
export interface AiSettings {
	decision: AiModelConfig & { api: 'openai' | 'jev' };
	reasoning: AiModelConfig & { api: 'openai' | 'anthropic' };
}

/** Scores OR alternatives in [0, 1]; boolean engines return 0 or 1. */
export type Engine = (input: string, criteria: Param, config?: AiConfig) => Promise<number>;

import { z } from 'zod';
import { TextSchema } from '../types.ts';

const scoreSchema = z.number().min(0).max(1);

export const ReasoningLevelSchema = z.enum([
	'provider-default',
	'none',
	'minimal',
	'low',
	'medium',
	'high',
	'xhigh',
	'max'
]);
export type ReasoningLevel = z.infer<typeof ReasoningLevelSchema>;

/** Source input, passing condition, and optional SDK reasoning level. */
export const AiRequestSchema = z.strictObject({
	input: z.string(),
	ask: TextSchema,
	reasoning: ReasoningLevelSchema.optional()
});
export type AiRequest = z.infer<typeof AiRequestSchema>;

/** Optional system-instruction override; an empty string explicitly removes the default. */
export const AiConfigSchema = z.strictObject({
	system: z.string().optional()
});
export type AiConfig = z.infer<typeof AiConfigSchema>;

/** Quoted evidence must be a nonempty exact substring of the request input. */
export const FailInstanceSchema = z.strictObject({
	quote: z.string().min(1).describe('Exact substring of the request input'),
	reason: z.string().optional()
});
export type FailInstance = z.infer<typeof FailInstanceSchema>;

/** Explanation of an existing score, with optional reasoning and quoted failures. */
export const AiExplanationSchema = z.strictObject({
	score: scoreSchema,
	reason: z.string().optional(),
	failures: z.array(FailInstanceSchema)
});
export type AiExplanation = z.infer<typeof AiExplanationSchema>;

/** Explicit provider routing and an environment-variable reference, never a credential. */
export const AiModelConfigSchema = z.strictObject({
	api: z.enum(['openai', 'jev', 'clef', 'anthropic']),
	url: z.url(),
	model: TextSchema,
	apiKeyEnv: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Expected an environment variable name')
});
export type AiModelConfig = z.infer<typeof AiModelConfigSchema>;

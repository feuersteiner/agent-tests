import { z } from 'zod';
import { ReasoningLevelSchema, SmartCheckSchema } from '../../types/index.ts';

const scoreSchema = z.number().min(0).max(1);

/** Source input, passing condition, and optional SDK reasoning level. */
export const AiRequestSchema = z.strictObject({
	input: z.string(),
	ask: SmartCheckSchema.shape.ask,
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

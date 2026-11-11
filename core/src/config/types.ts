import { z } from 'zod';
import { AiModelConfigSchema, ReasoningLevelSchema } from '../shared/deprecated-ai/types.ts';
import { TextSchema } from '../shared/types.ts';

const ThresholdSchema = z.number().min(0).max(1);

/** Both provider models are required even for tests using only regexes. */
export const AgentTestConfigSchema = z.strictObject({
	ignore: z.array(TextSchema).default(['**/.git', '**/.agents', '**/node_modules']),
	decision: AiModelConfigSchema.extend({ api: z.enum(['openai', 'jev']) }),
	reasoning: AiModelConfigSchema.extend({ api: z.enum(['openai', 'anthropic']) }),
	trigger: z.strictObject({ threshold: ThresholdSchema }),
	check: z.strictObject({
		threshold: ThresholdSchema,
		reasoning: ReasoningLevelSchema.optional()
	})
});
export type AgentTestConfig = z.infer<typeof AgentTestConfigSchema>;

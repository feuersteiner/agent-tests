import { z } from 'zod';
import { ReasoningLevelSchema } from '../shared/ai/types.ts';

const ThresholdSchema = z.number().finite().min(0).max(1);

/** Settings for each stage; AgentTest creates the AI instances itself. */
export const AgentTestConfigSchema = z.strictObject({
	trigger: z.strictObject({ threshold: ThresholdSchema }),
	check: z.strictObject({
		threshold: ThresholdSchema,
		reasoning: ReasoningLevelSchema.optional()
	})
});
export type AgentTestConfig = z.infer<typeof AgentTestConfigSchema>;

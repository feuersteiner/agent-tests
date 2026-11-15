import { z } from 'zod';
import { TextSchema } from '../types.ts';
import type { AgentTestParam } from '../types.ts';

/** A model endpoint and the environment variable holding its key, never the key itself. */
const ModelSchema = z.strictObject({
	url: z.url(),
	model: TextSchema,
	apiKeyEnv: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'Expected an environment variable name')
});

/** The config's `decision` section: the model behind the decide engine. */
const DecisionConfigSchema = ModelSchema.extend({ api: z.enum(['openai', 'jev']) });
export type AgentTestDecisionConfig = z.infer<typeof DecisionConfigSchema>;

/** The config's `reasoning` section: the model behind the reason engine. */
const ReasoningConfigSchema = ModelSchema.extend({ api: z.enum(['openai', 'anthropic']) });
export type AgentTestReasoningConfig = z.infer<typeof ReasoningConfigSchema>;

/** The config sections the engines need: the decision and reasoning models. */
export const EnginesConfigSchema = z.strictObject({
	decision: DecisionConfigSchema,
	reasoning: ReasoningConfigSchema
});
export type AgentTestEnginesConfig = z.infer<typeof EnginesConfigSchema>;

/** An engine score in [0, 1]. */
export const AgentTestScoreSchema = z.number().min(0).max(1);

/** The structured output the reasoning model must return. */
export const AgentTestReasoningOutputSchema = z.strictObject({ score: AgentTestScoreSchema });

/** Glob returns 0 or 1, AI returns a score in [0, 1], and grep returns an occurrence count. */
export type AgentTestEngine = (input: string, criteria: AgentTestParam) => Promise<number>;

/** The glob, grep, decide, and reason engines built by `createEngines`. */
export interface AgentTestEngines {
	glob: AgentTestEngine;
	grep: AgentTestEngine;
	decide: AgentTestEngine;
	reason: AgentTestEngine;
}

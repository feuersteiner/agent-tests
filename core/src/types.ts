import { z } from 'zod';
import { CheckSchema } from './check/types.ts';
import type { Check } from './check/types.ts';
import { EvalSchema } from './evals/types.ts';
import { IdSchema, TextSchema } from './shared/types.ts';
import type { Result } from './shared/types.ts';
import { TriggersSchema } from './trigger/types.ts';
import type { Trigger } from './trigger/types.ts';

export { CheckSchema } from './check/types.ts';
export type { Check, CheckConfig } from './check/types.ts';
export { AgentTestConfigSchema } from './config/types.ts';
export type { AgentTestConfig } from './config/types.ts';
export { EvalSchema, TestOutcomeSchema } from './evals/types.ts';
export type { Eval, TestOutcome } from './evals/types.ts';
export {
	AiModelConfigSchema,
	AiConfigSchema,
	AiExplanationSchema,
	AiRequestSchema,
	FailInstanceSchema,
	ReasoningLevelSchema
} from './shared/ai/types.ts';
export type {
	AiSettings,
	AiModelConfig,
	AiConfig,
	AiExplanation,
	AiRequest,
	FailInstance,
	ReasoningLevel
} from './shared/ai/types.ts';
export { ParamSchema } from './shared/types.ts';
export type { Param, Result, ResultEntry } from './shared/types.ts';
export { FilterSchema, TriggerSchema, TriggersSchema } from './trigger/types.ts';
export type { FilterConfig, Trigger } from './trigger/types.ts';

/** What each stage of a run produced. */
export type AgentTestResult = { trigger: Result<Trigger>; check: Result<Check> };

/** Test identity, description, and optional source digest. */
export const MetadataSchema = z.strictObject({
	id: IdSchema,
	title: TextSchema,
	description: TextSchema,
	source: z
		.string()
		.regex(/^sha256:[a-fA-F\d]{64}$/, 'Expected sha256: followed by 64 hexadecimal digits')
		.optional()
});
export type Metadata = z.infer<typeof MetadataSchema>;

/** test.yaml structure; optional fields have no implicit defaults. */
export const AgentTestSchema = MetadataSchema.extend({
	triggers: TriggersSchema.optional(),
	checks: z.array(CheckSchema).min(1),
	evals: z.array(EvalSchema)
});
export type AgentTest = z.infer<typeof AgentTestSchema>;

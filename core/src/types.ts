import { z } from 'zod';
import { AiModelConfigSchema, ReasoningLevelSchema } from './shared/ai/types.ts';
import { CheckSchema } from './check/types.ts';
import type { Check, CheckConfig } from './check/types.ts';
import { EvalSchema } from './evals/types.ts';
import { IdSchema, TextSchema } from './shared/types.ts';
import type { Result } from './shared/types.ts';
import { TriggersSchema } from './trigger/types.ts';
import type { FilterConfig, Trigger } from './trigger/types.ts';

export { CheckSchema } from './check/types.ts';
export type { Check, CheckConfig } from './check/types.ts';
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

/** Both providers are required even when a test uses only regexes. */
export const AgentTestConfigSchema = z.strictObject({
	decision: AiModelConfigSchema.extend({ api: z.enum(['openai', 'jev', 'clef']) }),
	reasoning: AiModelConfigSchema.extend({ api: z.enum(['openai', 'anthropic']) }),
	trigger: z.strictObject({ threshold: z.number().min(0).max(1) }),
	check: z.strictObject({
		threshold: z.number().min(0).max(1),
		reasoning: ReasoningLevelSchema.optional()
	})
});
export type AgentTestConfig = z.infer<typeof AgentTestConfigSchema>;

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

/** Validated test.yaml data; optional fields have no implicit defaults. */
export const AgentTestSchema = MetadataSchema.extend({
	triggers: TriggersSchema.optional(),
	checks: z.array(CheckSchema).min(1),
	evals: z.array(EvalSchema)
}).superRefine((value, context) => {
	const ids = new Set<string>();
	value.checks.forEach((entry, index) => {
		if (ids.has(entry.id)) {
			context.addIssue({
				code: 'custom',
				path: ['checks', index, 'id'],
				message: 'Duplicate check id'
			});
		}
		ids.add(entry.id);
	});
});
export type AgentTest = z.infer<typeof AgentTestSchema>;

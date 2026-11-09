import { z } from 'zod';
import { CheckSchema } from './check/types.ts';
import type { Check } from './check/types.ts';
import { EvalSchema } from './evals/types.ts';
import type { Eval } from './evals/types.ts';
import { IdSchema, TextSchema } from './shared/types.ts';
import type { Result } from './shared/types.ts';
import { SelectSchema } from './select/types.ts';
import type { SelectResult } from './select/types.ts';

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
} from './shared/engines/types.ts';
export type {
	AiSettings,
	AiModelConfig,
	AiConfig,
	AiExplanation,
	AiRequest,
	FailInstance,
	ReasoningLevel
} from './shared/engines/types.ts';
export { ParamSchema } from './shared/types.ts';
export type { Param, Result, ResultEntry } from './shared/types.ts';
export { SelectSchema, SelectStepSchema } from './select/types.ts';
export type { Select, SelectStep, SelectConfig, SelectResult, EngineSet } from './select/types.ts';

/** What each stage of a run produced. */
export type AgentTestResult = { select: SelectResult; check: Result<Check> };

/** A test's labeled-example results within a suite. */
export type AgentTestEvalResult = { id: string; result: Result<Eval> };

/** Test identity, description, optional tags, and optional source digest. */
export const MetadataSchema = z.strictObject({
	id: IdSchema,
	title: TextSchema,
	description: TextSchema,
	tags: z.array(z.string()).optional(),
	source: z
		.string()
		.regex(/^sha256:[a-fA-F\d]{64}$/, 'Expected sha256: followed by 64 hexadecimal digits')
		.optional()
});
export type Metadata = z.infer<typeof MetadataSchema>;

/** test.yaml structure; select and select.type are required. */
export const AgentTestSchema = MetadataSchema.extend({
	select: SelectSchema,
	checks: z.array(CheckSchema).min(1),
	evals: z.array(EvalSchema)
});
export type AgentTest = z.infer<typeof AgentTestSchema>;

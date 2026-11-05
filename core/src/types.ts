import { z } from 'zod';
import { CheckSchema } from './check/types.ts';
import { EvalSchema } from './eval.ts';
import { IdSchema, TextSchema } from './shared/types.ts';
import { TriggersSchema } from './trigger/types.ts';

export { CheckSchema } from './check/types.ts';
export type { Check } from './check/types.ts';
export { EvalSchema, TestOutcomeSchema } from './eval.ts';
export type { Eval, TestOutcome } from './eval.ts';
export { ReasoningLevelSchema } from './shared/ai/types.ts';
export type { ReasoningLevel } from './shared/ai/types.ts';
export { ParamSchema } from './shared/types.ts';
export type { Param } from './shared/types.ts';
export { FilterSchema, TriggerSchema, TriggersSchema } from './trigger/types.ts';
export type { Trigger } from './trigger/types.ts';

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

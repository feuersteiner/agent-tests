// TODO: Move contracts beside owning modules; preserve this barrel, root exports, and ./types (PLAN.md).
import { z } from 'zod';
import { CheckSchema } from './check.ts';
import { EvalSchema } from './eval.ts';
import { MetadataSchema } from './metadata.ts';
import { TriggerSchema } from './trigger.ts';

export {
	CheckSchema,
	DeepCheckSchema,
	FastCheckSchema,
	ReasoningLevelSchema,
	SmartCheckSchema
} from './check.ts';
export type { Check, DeepCheck, FastCheck, ReasoningLevel, SmartCheck } from './check.ts';
export { EvalSchema, TestOutcomeSchema } from './eval.ts';
export type { Eval, TestOutcome } from './eval.ts';
export { MetadataSchema } from './metadata.ts';
export type { Metadata } from './metadata.ts';
export { PatternsSchema } from './primitives.ts';
export type { Patterns } from './primitives.ts';
export { TriggerFilterSchema, TriggerSchema } from './trigger.ts';
export type { Trigger, TriggerFilter } from './trigger.ts';

/** Validated test.yaml data; optional fields have no implicit defaults. */
export const AgentTestSchema = MetadataSchema.extend({
	triggers: z.union([TriggerSchema, z.array(TriggerSchema).min(1)]),
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

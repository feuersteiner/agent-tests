import { z } from 'zod';
import { PatternsSchema, text } from './primitives.ts';

/** Ordered glob/regex and model filters for one file attribute. */
export const TriggerFilterSchema = z
	.strictObject({
		match: PatternsSchema.optional(),
		ask: text.optional()
	})
	.refine((value) => value.match !== undefined || value.ask !== undefined, 'Requires match or ask');
export type TriggerFilter = z.infer<typeof TriggerFilterSchema>;

/** File attributes that must all pass, in their written order. */
export const TriggerSchema = z
	.strictObject({
		path: TriggerFilterSchema.optional(),
		content: TriggerFilterSchema.optional()
	})
	.refine(
		(value) => value.path !== undefined || value.content !== undefined,
		'Requires path or content'
	);
export type Trigger = z.infer<typeof TriggerSchema>;

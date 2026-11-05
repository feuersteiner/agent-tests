import { z } from 'zod';
import type { AI } from '../shared/ai/index.ts';
import type { Source } from '../shared/source.ts';
import { MetadataSchema } from '../types/metadata.ts';

const value = z.string().refine((param) => param.trim().length > 0, 'Must not be blank');

/** One filter param or a nonempty list of OR alternatives. */
export const ParamSchema = z.union([value, z.array(value).min(1)]);
export type Param = z.infer<typeof ParamSchema>;

/** Caller-owned dependencies; only ask uses them. */
export type FilterConfig = { threshold: number; ai: AI };

/** Pass function every filter imp lements: does this source satisfy any alternative in the param? */
export interface SourceFilter {
	(source: Source, param: Param, config: FilterConfig): Promise<boolean>;
}

/** AND filters, always run as glob, grep, then ask; at least one is required. */
export const FilterSchema = z
	.strictObject({
		glob: ParamSchema.optional(),
		grep: ParamSchema.optional(),
		ask: ParamSchema.optional()
	})
	.refine(
		(filter) => filter.glob !== undefined || filter.grep !== undefined || filter.ask !== undefined,
		'Requires glob, grep, or ask'
	);

/** One described inclusion rule; all configured filters must pass. */
export const TriggerSchema = FilterSchema.safeExtend({
	id: MetadataSchema.shape.id,
	description: MetadataSchema.shape.description
});
export type Trigger = z.infer<typeof TriggerSchema>;

/** OR between triggers; an empty list selects every source. */
export const TriggersSchema = z.array(TriggerSchema);

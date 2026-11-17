import { z } from 'zod';
import { AgentTestParamSchema, ThresholdSchema } from '../types.ts';

/** Filters that pick the sources a Test inspects; at least one is required. */
export const SelectSchema = z
	.strictObject({
		glob: AgentTestParamSchema.optional(),
		grep: AgentTestParamSchema.optional(),
		decide: AgentTestParamSchema.optional()
	})
	.refine(
		(select) =>
			select.glob !== undefined || select.grep !== undefined || select.decide !== undefined,
		'Requires glob, grep, or decide'
	);
export type AgentTestSelect = z.infer<typeof SelectSchema>;

/** The config's `select` section: the score a source needs to be selected. */
export const SelectConfigSchema = z.strictObject({ threshold: ThresholdSchema });
export type AgentTestSelectConfig = z.infer<typeof SelectConfigSchema>;

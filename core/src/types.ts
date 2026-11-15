import { z } from 'zod';

/** Lowercase kebab-case identifier. */
export const IdSchema = z
	.string()
	.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Expected a lowercase kebab-case id');

/** Text with at least one non-whitespace character. */
export const TextSchema = z
	.string()
	.refine((value) => value.trim().length > 0, 'Must not be blank');

/** One param or a nonempty list; each engine defines how a list combines. */
export const AgentTestParamSchema = z.union([TextSchema, z.array(TextSchema).min(1)], {
	error: 'Expected text or a nonempty list of text'
});
export type AgentTestParam = z.infer<typeof AgentTestParamSchema>;

/** A score threshold in [0, 1]. */
export const ThresholdSchema = z.number().min(0).max(1);

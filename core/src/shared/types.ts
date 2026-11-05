import { z } from 'zod';

/** Lowercase kebab-case identifier. */
export const IdSchema = z
	.string()
	.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Expected a lowercase kebab-case id');

/** Text with at least one non-whitespace character. */
export const TextSchema = z
	.string()
	.refine((value) => value.trim().length > 0, 'Must not be blank');

/** One param or a nonempty list of OR alternatives. */
export const ParamSchema = z.union([TextSchema, z.array(TextSchema).min(1)]);
export type Param = z.infer<typeof ParamSchema>;

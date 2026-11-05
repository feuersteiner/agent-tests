import { z } from 'zod';

/** Lowercase kebab-case identifier. */
export const IdSchema = z
	.string()
	.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Expected a lowercase kebab-case id');

const value = z.string().refine((param) => param.trim().length > 0, 'Must not be blank');

/** One param or a nonempty list of OR alternatives. */
export const ParamSchema = z.union([value, z.array(value).min(1)]);
export type Param = z.infer<typeof ParamSchema>;

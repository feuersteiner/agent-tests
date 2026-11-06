import { z } from 'zod';
import type { Source } from './source.ts';

/** Lowercase kebab-case identifier. */
export const IdSchema = z
	.string()
	.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Expected a lowercase kebab-case id');

/** Text with at least one non-whitespace character. */
export const TextSchema = z
	.string()
	.refine((value) => value.trim().length > 0, 'Must not be blank');

/** One param or a nonempty list; each feature defines how a list combines. */
export const ParamSchema = z.union([TextSchema, z.array(TextSchema).min(1)]);
export type Param = z.infer<typeof ParamSchema>;

/**
 * What happened when one source ran through one trigger, check, or eval.
 * `flagged` means it fired: a trigger matched, a check found a violation, or an eval
 * did not match its label. `trace` lists what failed along the way, such as `failed grep`.
 */
export type ResultEntry<T> = {
	source: Source;
	check: T;
	flagged: boolean;
	trace: string[];
	findings?: Finding[];
};

/** Grounded evidence with a one-based source location. */
export type Finding = { quote: string; reason?: string; line: number; column: number };

/** Every entry of a run, split by whether it was flagged. */
export type Result<T> = { flagged: ResultEntry<T>[]; cleared: ResultEntry<T>[] };

import type { z } from 'zod';
import { Engine } from '../index.ts';
import { FastCheckSchema } from '../../types/index.ts';
import type { Patterns } from '../../types/index.ts';

/** Regex patterns with at least one match or maybe pattern. */
export const FastEngineParamsSchema = FastCheckSchema;
export type FastEngineParams = z.infer<typeof FastEngineParamsSchema>;

/** Compile every configured pattern before checking for a hit. */
const compile = (patterns: Patterns | undefined) => {
	const values = patterns === undefined ? [] : Array.isArray(patterns) ? patterns : [patterns];
	return values.map((pattern) => new RegExp(pattern));
};

/**
 * Score text regexes: match gives 1, maybe gives 0.5, otherwise 0.
 * Match takes priority; inherited run validates params and the returned score.
 */
export class FastEngine extends Engine<FastEngineParams> {
	/** Shared fast-check pattern constraints. */
	protected override readonly paramsSchema = FastEngineParamsSchema;

	/**
	 * Compile all patterns, then test each list as alternatives.
	 * @param input - Text to inspect.
	 * @param params - Validated match and maybe patterns.
	 * @returns 1 for match, 0.5 for maybe, or 0 for neither.
	 * @throws Pattern compilation errors, as a rejected promise.
	 */
	protected override async score(input: string, params: FastEngineParams): Promise<number> {
		const match = compile(params.match);
		const maybe = compile(params.maybe);
		if (match.some((pattern) => pattern.test(input))) return 1;
		return maybe.some((pattern) => pattern.test(input)) ? 0.5 : 0;
	}
}

import { PatternsSchema } from '../../types/index.ts';
import type { Patterns } from '../../types/index.ts';
import { Filter } from './index.ts';

/** Compile every regex before checking content for an alternative match. */
export class ContentMatchFilter extends Filter<Patterns> {
	protected override readonly paramsSchema = PatternsSchema;

	protected override async matches(input: string, patterns: Patterns): Promise<boolean> {
		const values = Array.isArray(patterns) ? patterns : [patterns];
		const regexes = values.map((pattern) => new RegExp(pattern));
		return regexes.some((pattern) => pattern.test(input));
	}
}

import { posix } from 'node:path';
import { PatternsSchema } from '../types/index.ts';
import type { Patterns } from '../types/index.ts';
import { Trigger } from './index.ts';

/** Match a POSIX path against alternative glob patterns. */
export class PathMatchTrigger extends Trigger<Patterns> {
	protected override readonly paramsSchema = PatternsSchema;

	protected override async matches(input: string, patterns: Patterns): Promise<boolean> {
		return (Array.isArray(patterns) ? patterns : [patterns]).some((pattern) =>
			posix.matchesGlob(input, pattern)
		);
	}
}

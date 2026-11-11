import { Minimatch } from 'minimatch';
import { ParamSchema } from '../types.ts';
import type { Engine } from './types.ts';

/** Returns 1 if any glob matches the path, otherwise 0. */
export const createGlobEngine = (): Engine => {
	const patterns = new Map<string, Minimatch>();
	return async (input, criteria) => {
		const compiled = [ParamSchema.parse(criteria)].flat().map((pattern) => {
			let matcher = patterns.get(pattern);
			if (!matcher) {
				matcher = new Minimatch(pattern, { dot: true, platform: 'linux' });
				patterns.set(pattern, matcher);
			}
			return matcher;
		});
		return Number(compiled.some((matcher) => matcher.match(input)));
	};
};

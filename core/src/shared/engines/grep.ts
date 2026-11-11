import { ParamSchema } from '../types.ts';
import type { Engine } from './types.ts';

/** Returns 1 if any regex matches the input, otherwise 0. */
export const createGrepEngine = (): Engine => {
	const patterns = new Map<string, RegExp>();
	return async (input, criteria) => {
		const compiled = [ParamSchema.parse(criteria)].flat().map((pattern) => {
			let matcher = patterns.get(pattern);
			if (!matcher) {
				matcher = new RegExp(pattern);
				patterns.set(pattern, matcher);
			}
			return matcher;
		});
		return Number(compiled.some((matcher) => matcher.test(input)));
	};
};

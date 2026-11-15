import type { AgentTestEngine } from './types.ts';

/** Returns the highest non-overlapping occurrence count among regex alternatives. */
export const createGrepEngine = (): AgentTestEngine => {
	const patterns = new Map<string, RegExp>();
	return async (input, criteria) => {
		const compiled = [criteria].flat().map((pattern) => {
			let matcher = patterns.get(pattern);
			if (!matcher) {
				matcher = new RegExp(pattern, 'g');
				patterns.set(pattern, matcher);
			}
			return matcher;
		});
		return Math.max(...compiled.map((matcher) => Array.from(input.matchAll(matcher)).length));
	};
};

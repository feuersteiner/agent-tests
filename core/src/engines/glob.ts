import { Minimatch } from 'minimatch';
import type { AgentTestEngine } from '../types.ts';

/** Returns 1 if any glob matches the path, otherwise 0. */
export const createGlobEngine = (): AgentTestEngine => {
	const patterns = new Map<string, Minimatch>();
	return async (input, criteria) => {
		const compiled = [criteria].flat().map((pattern) => {
			let matcher = patterns.get(pattern);
			if (!matcher) {
				matcher = new Minimatch(pattern, { dot: true, nonegate: true, platform: 'linux' });
				patterns.set(pattern, matcher);
			}
			return matcher;
		});
		return Number(compiled.some((matcher) => matcher.match(input)));
	};
};

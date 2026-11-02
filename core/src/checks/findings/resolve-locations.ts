import type { DecisionResponse } from '../../models/index.js';
import type { PatternMatch } from '../types.js';
import type { FindingLocation } from './types.js';

/** Prefer exact pattern offsets, then locate quoted model evidence, falling back to file start. */
export const resolveLocations = (
	content: string,
	matches: PatternMatch[],
	response?: DecisionResponse
): FindingLocation[] => {
	const modelMatches = response?.matches?.map((match) => {
		const lines = content.split('\n');
		const line = match.line && match.line >= 1 && match.line <= lines.length ? match.line : 1;
		const offset = lines.slice(0, line - 1).reduce((sum, value) => sum + value.length + 1, 0);
		const hinted = match.text ? content.indexOf(match.text, offset) : -1;
		const found = hinted >= 0 ? hinted : match.text ? content.indexOf(match.text) : -1;
		return { text: match.text, index: found >= 0 ? found : offset, message: match.message };
	});
	return matches.length ? matches : modelMatches?.length ? modelMatches : [{ index: 0 }];
};

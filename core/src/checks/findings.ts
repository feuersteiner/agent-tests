import type { CheckDefinition, TestDefinition } from '../schema/index.js';
import type { DecisionResponse } from '../models/index.js';
import type { Finding, FindingLevel } from '../results/index.js';
import type { CheckTarget, PatternMatch } from './types.js';

/** Locate a character offset in a file using one-based line and column numbers. */
const locate = (content: string, index: number) => {
	const prefix = content.slice(0, Math.max(0, index));
	return { line: prefix.split('\n').length, column: index - prefix.lastIndexOf('\n') };
};

/** Build findings for definite pattern matches or structured model responses. */
export const createFindings = (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	level: FindingLevel,
	severity: 'error' | 'warning',
	matches: PatternMatch[] = [],
	response?: DecisionResponse
): Finding[] => {
	const modelMatches = response?.matches?.map((match) => {
		const lines = target.content.split('\n');
		const line = match.line && match.line >= 1 && match.line <= lines.length ? match.line : 1;
		const offset = lines.slice(0, line - 1).reduce((sum, value) => sum + value.length + 1, 0);
		const hinted = match.text ? target.content.indexOf(match.text, offset) : -1;
		const found = hinted >= 0 ? hinted : match.text ? target.content.indexOf(match.text) : -1;
		return { text: match.text, index: found >= 0 ? found : offset, message: match.message };
	});
	const locations = matches.length ? matches : modelMatches?.length ? modelMatches : [{ index: 0 }];
	return locations.map((location) => ({
		testId: definition.id,
		checkId: check.id,
		level,
		file: target.path,
		...locate(target.content, location.index),
		message:
			'message' in location && typeof location.message === 'string'
				? location.message
				: (response?.message ?? check.message),
		fix: check.fix,
		severity,
		...(severity === 'warning' && check['human-tiebreak'] ? { requiresReview: true } : {})
	}));
};

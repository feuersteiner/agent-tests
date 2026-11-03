import type { CheckDefinition, TestDefinition } from '../../schema/index.js';
import type { DecisionResponse } from '../../models/index.js';
import type { Finding, FindingLevel } from '../../results/index.js';
import type { CheckTarget } from '../types.js';
import type { FindingLocation } from './types.js';
import { locate } from './utils.js';

/** Explain resolved locations using check defaults and any model-specific messages. */
export const renderFindings = (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	level: FindingLevel,
	severity: 'error' | 'warning',
	locations: FindingLocation[],
	response?: DecisionResponse
): Finding[] => {
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

import type { CheckDefinition, TestDefinition } from '../../schema/index.js';
import type { DecisionResponse } from '../../models/index.js';
import type { Finding, FindingLevel } from '../../results/index.js';
import type { CheckTarget, PatternMatch } from '../types.js';
import { resolveLocations } from './resolve-locations.js';
import { renderFindings } from './render-findings.js';

/** Return explained findings from exact offsets or model evidence; this stage performs no I/O. */
export const createFindings = (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	level: FindingLevel,
	severity: 'error' | 'warning',
	matches: PatternMatch[] = [],
	response?: DecisionResponse
): Finding[] => {
	const locations = resolveLocations(target.content, matches, response);
	return renderFindings(definition, check, target, level, severity, locations, response);
};

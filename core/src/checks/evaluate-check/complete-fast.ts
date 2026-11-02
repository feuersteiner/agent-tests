import type { CheckDefinition, TestDefinition } from '../../schema/index.js';
import type { CheckEvaluation, CheckTarget } from '../types.js';
import { emptyEvaluation } from './utils.js';
import type { PatternMatch } from '../types.js';
import { createFindings } from '../findings/index.js';

/** Keep exact regex offsets for definite errors and unresolved hints; empty scans pass. */
export const completeFast = (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	matches: PatternMatch[],
	hints: PatternMatch[]
): CheckEvaluation => {
	if (!matches.length && !hints.length) return emptyEvaluation('pass');
	return {
		...emptyEvaluation(matches.length ? 'fail' : 'unsure'),
		findings: createFindings(
			definition,
			check,
			target,
			'fast',
			matches.length ? 'error' : 'warning',
			matches.length ? matches : hints
		)
	};
};

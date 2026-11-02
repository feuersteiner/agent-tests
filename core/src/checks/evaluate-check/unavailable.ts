import type { CheckDefinition, TestDefinition } from '../../schema/index.js';
import type { CheckEvaluation, CheckTarget } from '../types.js';
import { emptyEvaluation } from './utils.js';

/** Skip a model-required check with a diagnostic that identifies the rule and target. */
export const unavailable = (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget
): CheckEvaluation => {
	const reason = `Model unavailable; ${definition.id}/${check.id} requires model evaluation.`;
	return {
		...emptyEvaluation('skip'),
		warnings: [reason],
		skipped: [{ testId: definition.id, file: target.path, reason }]
	};
};

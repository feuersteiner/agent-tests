import type { TestDefinition } from '../schema/index.js';
import type { DecisionModel } from '../models/index.js';
import type { CheckEvaluation, CheckTarget } from './types.js';
import { evaluateCheck } from './evaluate-check/index.js';

/** Evaluate all checks and preserve failed, uncertain and skipped outcomes separately. */
export const evaluateChecks = async (
	definition: TestDefinition,
	target: CheckTarget,
	model?: DecisionModel
): Promise<CheckEvaluation> => {
	const results: CheckEvaluation[] = [];
	for (const check of definition.checks)
		results.push(await evaluateCheck(definition, check, target, model));

	const outcomes = results.map((result) => result.outcome);
	const outcome = outcomes.includes('fail')
		? 'fail'
		: outcomes.includes('skip')
			? 'skip'
			: outcomes.includes('unsure')
				? 'unsure'
				: 'pass';
	return {
		outcome,
		findings: results.flatMap((result) => result.findings),
		warnings: [...new Set(results.flatMap((result) => result.warnings))],
		skipped: results.flatMap((result) => result.skipped),
		checked: results.reduce((sum, result) => sum + result.checked, 0)
	};
};

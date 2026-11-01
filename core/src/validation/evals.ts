import { isSafeEvalPath } from '../evals/index.js';
import type { CheckDefinition, TestDefinition, TestOutcome } from '../schema/index.js';
import { evaluateTriggers } from '../triggers/index.js';
import { matchesPattern } from './patterns.js';
import type { ValidationIssue } from './types.js';

const checkOutcome = (check: CheckDefinition, content: string): TestOutcome | undefined => {
	if (matchesPattern(check.fast?.match, content)) return 'fail';
	if (check.smart || check.deep) return undefined;
	return matchesPattern(check.fast?.maybe, content) ? 'unsure' : 'pass';
};

const definiteOutcome = (definition: TestDefinition, content: string): TestOutcome | undefined => {
	const outcomes = definition.checks.map((check) => checkOutcome(check, content));
	if (outcomes.includes('fail')) return 'fail';
	if (outcomes.includes(undefined)) return undefined;
	return outcomes.includes('unsure') ? 'unsure' : 'pass';
};

/** Checks only outcomes that static triggers and fast patterns can establish without a model. */
export const validateEvals = async (definition: TestDefinition): Promise<ValidationIssue[]> => {
	const issues: ValidationIssue[] = [];
	for (const example of definition.evals) {
		if (!isSafeEvalPath(example.path)) {
			issues.push({
				code: 'eval-path',
				message: 'Eval paths must stay inside the fixture repository.',
				severity: 'error',
				evalName: example.name
			});
			continue;
		}
		const trigger = await evaluateTriggers(definition.triggers, example);
		if (trigger.skipped) continue;
		const actual = trigger.matched ? definiteOutcome(definition, example.content) : 'skip';
		if (actual !== undefined && actual !== example.expect)
			issues.push({
				code: 'pattern-eval-mismatch',
				message: `Static patterns produce ${actual}; the example expects ${example.expect}.`,
				severity: 'error',
				evalName: example.name
			});
	}
	return issues;
};

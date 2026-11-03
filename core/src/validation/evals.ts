import { isSafeEvalPath } from '../evals/index.js';
import type { TestDefinition } from '../schema/index.js';
import { evaluateTriggers } from '../triggers/index.js';
import { definiteOutcome } from './utils.js';
import type { ValidationIssue } from './types.js';

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

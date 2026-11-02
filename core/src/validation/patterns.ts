import type { TestDefinition } from '../schema/index.js';
import { collectPatterns } from './collect-patterns.js';
import { isRiskyPattern } from './is-risky-pattern.js';
import type { ValidationIssue } from './types.js';

/** Flags invalid expressions and common exponential backtracking patterns without executing them. */
export const validatePatterns = (definition: TestDefinition): ValidationIssue[] =>
	collectPatterns(definition).flatMap(({ value, checkId }): ValidationIssue[] => {
		try {
			new RegExp(value);
		} catch {
			return [
				{
					code: 'pattern-invalid',
					message: 'A regex pattern is invalid.',
					severity: 'error',
					checkId
				}
			];
		}
		if (isRiskyPattern(value))
			return [
				{
					code: 'pattern-risky',
					message: 'A regex uses nested repetition or backreferences; simplify it before running.',
					severity: 'error',
					checkId
				}
			];

		return [];
	});

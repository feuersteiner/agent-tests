import type { CheckDefinition, TestDefinition, TestOutcome } from '../schema/index.js';
import type { ValidationIssue, ValidationResult } from './types.js';

/** Builds the public validation result from all collected issues. */
export const validationResult = (
	directory: string,
	issues: ValidationIssue[],
	testId?: string
): ValidationResult => {
	const valid = !issues.some((issue) => issue.severity === 'error');
	return { directory, testId, valid, issues, exitCode: valid ? 0 : 1 };
};

/** Normalizes the optional single-pattern and multiple-pattern schema forms. */
export const listPatterns = (value?: string | string[]): string[] =>
	value === undefined ? [] : typeof value === 'string' ? [value] : value;

/** Tests validated patterns against an example's content. */
const matchesPattern = (patterns: string | string[] | undefined, content: string): boolean =>
	listPatterns(patterns).some((pattern) => new RegExp(pattern).test(content));

/** Resolves one check only when fast patterns can determine its outcome. */
const checkOutcome = (check: CheckDefinition, content: string): TestOutcome | undefined => {
	if (matchesPattern(check.fast?.match, content)) return 'fail';
	if (check.smart || check.deep) return undefined;
	return matchesPattern(check.fast?.maybe, content) ? 'unsure' : 'pass';
};

/** Combines statically decidable checks; model decisions remain unknown. */
export const definiteOutcome = (
	definition: TestDefinition,
	content: string
): TestOutcome | undefined => {
	const outcomes = definition.checks.map((check) => checkOutcome(check, content));
	if (outcomes.includes('fail')) return 'fail';
	if (outcomes.includes(undefined)) return undefined;
	return outcomes.includes('unsure') ? 'unsure' : 'pass';
};

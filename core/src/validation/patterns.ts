import type { TestDefinition } from '../schema/index.js';
import type { ValidationIssue } from './types.js';

interface Pattern {
	value: string;
	checkId?: string;
}

const list = (value?: string | string[]): string[] =>
	value === undefined ? [] : typeof value === 'string' ? [value] : value;

const collectPatterns = (definition: TestDefinition): Pattern[] => {
	const triggers = Array.isArray(definition.triggers) ? definition.triggers : [definition.triggers];
	return [
		...triggers.flatMap((trigger) => list(trigger.content?.match).map((value) => ({ value }))),
		...definition.checks.flatMap((check) =>
			[...list(check.fast?.match), ...list(check.fast?.maybe)].map((value) => ({
				value,
				checkId: check.id
			}))
		)
	];
};

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
		if (/\([^)]*[+*][^)]*\)[+*{]/.test(value) || /\\[1-9]/.test(value))
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

export const matchesPattern = (patterns: string | string[] | undefined, content: string): boolean =>
	list(patterns).some((pattern) => new RegExp(pattern).test(content));

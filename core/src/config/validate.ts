import { z } from 'zod';
import { AgentTestSchema } from '../types.ts';
import type { AgentTest } from '../types.ts';
import { AgentTestConfigSchema } from './types.ts';
import type { AgentTestConfig } from './types.ts';

/** Validate schema structure; use validateTest/validateTests/validateConfig for semantics. */
export const validate = <Schema extends z.ZodType>(
	value: unknown,
	schema: Schema
): z.output<Schema> => {
	const result = schema.safeParse(value);
	if (!result.success)
		throw new Error(`Invalid configuration:\n${describeIssues(result.error.issues).join('\n')}`);

	return result.data;
};

/** Validate test structure, unique check IDs, and grep expressions before execution. */
export const validateTest = (value: unknown): AgentTest => {
	const test = validate(value, AgentTestSchema);
	const ids = new Set<string>();
	const issues = [
		...test.checks.flatMap((entry, index) => {
			const duplicate = ids.has(entry.id);
			ids.add(entry.id);
			return duplicate ? [`checks.${index}.id: Duplicate check id`] : [];
		}),
		...(
			[
				['triggers', test.triggers ?? []],
				['checks', test.checks]
			] as const
		).flatMap(([field, entries]) =>
			entries.flatMap((entry, index) => {
				const patterns = entry.grep === undefined ? [] : [entry.grep].flat();
				return patterns.flatMap((pattern, patternIndex) => {
					try {
						new RegExp(pattern);
						return [];
					} catch {
						const path = `${field}.${index}.grep${Array.isArray(entry.grep) ? `.${patternIndex}` : ''}`;
						return [`${path}: Invalid regular expression`];
					}
				});
			})
		)
	];
	if (issues.length) throw new Error(`Invalid test definition:\n${issues.join('\n')}`);
	return test;
};

/** Validate every definition and reject duplicate test IDs within the collection. */
export const validateTests = (value: unknown): AgentTest[] => {
	const tests = validate(value, z.array(z.unknown())).map(validateTest);
	const ids = new Set<string>();
	const issues = tests.flatMap((test, index) => {
		const duplicate = ids.has(test.id);
		ids.add(test.id);
		return duplicate ? [`${index}.id: Duplicate test id`] : [];
	});
	if (issues.length) throw new Error(`Invalid test definitions:\n${issues.join('\n')}`);
	return tests;
};

/** Validate provider routes and stage settings before model construction. */
export const validateConfig = (value: unknown): AgentTestConfig => {
	const config = validate(value, AgentTestConfigSchema);
	const issues = (['decision', 'reasoning'] as const).flatMap((field) => {
		const value = config[field].url;
		const url = new URL(value);
		const valid =
			!url.username &&
			!url.password &&
			!value.includes('?') &&
			!value.includes('#') &&
			(url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost'));
		return valid
			? []
			: [`${field}.url: Expected HTTPS or HTTP localhost without credentials, query, or fragment`];
	});
	if (issues.length) throw new Error(`Invalid configuration:\n${issues.join('\n')}`);
	return config;
};

const describeIssues = (issues: z.core.$ZodIssue[], parent: PropertyKey[] = []): string[] => {
	return issues.flatMap((issue) => {
		const path = [...parent, ...issue.path];
		if (issue.code === 'invalid_union')
			return issue.errors.flatMap((errors) => describeIssues(errors, path));

		return [`${path.map(String).join('.') || 'value'}: ${issue.message}`];
	});
};

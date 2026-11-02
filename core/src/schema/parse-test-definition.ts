import { definitionSchema } from './definition.js';
import type { TestDefinition } from './types.js';

/** Validate parsed data, preserving key order; reject unknown keys without echoing input values. */
export const parseTestDefinition = (value: unknown): TestDefinition => {
	const result = definitionSchema.safeParse(value);
	if (!result.success) {
		const issue = result.error.issues[0];
		const path = issue?.path.join('.') || 'root';
		throw new Error(`Invalid test definition at ${path}`);
	}
	return value as TestDefinition;
};

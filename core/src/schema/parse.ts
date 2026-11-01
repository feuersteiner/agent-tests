import { parseDocument } from 'yaml';
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

/** Parse a single YAML document with duplicate keys and aliases rejected; never include source text. */
export const parseTestYaml = (text: string): TestDefinition => {
	let value: unknown;
	try {
		const document = parseDocument(text, { uniqueKeys: true });
		if (document.errors.length > 0) throw new Error('Invalid YAML');
		value = document.toJS({ maxAliasCount: 0 });
	} catch {
		throw new Error('Invalid test YAML');
	}
	return parseTestDefinition(value);
};

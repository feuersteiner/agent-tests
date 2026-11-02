import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { parseTestYaml } from '../schema/index.js';
import type { TestDefinition } from '../schema/index.js';
import { validateEvals } from './evals.js';
import { validatePatterns } from './patterns.js';
import { validateSource } from './source.js';
import type { ValidationResult } from './types.js';
import { validationResult } from './utils.js';

/** Validates schema, source freshness and static eval outcomes without making model calls. */
export const validateTest = async (directory: string): Promise<ValidationResult> => {
	let definition: TestDefinition;
	try {
		definition = parseTestYaml(await readFile(join(directory, 'test.yaml'), 'utf8'));
	} catch {
		return validationResult(directory, [
			{
				code: 'schema-invalid',
				message: 'test.yaml is missing, unreadable or does not match the test schema.',
				severity: 'error'
			}
		]);
	}
	const issues = await validateSource(directory, definition);
	if (definition.id !== basename(directory))
		issues.push({
			code: 'id-mismatch',
			message: 'The test id must match its directory name.',
			severity: 'error'
		});

	const patterns = validatePatterns(definition);
	issues.push(...patterns);
	if (patterns.length === 0) issues.push(...(await validateEvals(definition)));
	return validationResult(directory, issues, definition.id);
};

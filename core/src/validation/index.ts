import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { discoverTestDirectories } from '../discovery/index.js';
import { parseTestYaml } from '../schema/index.js';
import type { TestDefinition } from '../schema/index.js';
import { validateEvals } from './evals.js';
import { validatePatterns } from './patterns.js';
import { validateSource } from './source.js';
import type { ValidationIssue, ValidationResult } from './types.js';

export type { ValidationIssue, ValidationResult } from './types.js';

const result = (
	directory: string,
	issues: ValidationIssue[],
	testId?: string
): ValidationResult => {
	const valid = !issues.some((issue) => issue.severity === 'error');
	return { directory, testId, valid, issues, exitCode: valid ? 0 : 1 };
};

/** Validates schema, source freshness and static eval outcomes without making model calls. */
export const validateTest = async (directory: string): Promise<ValidationResult> => {
	let definition: TestDefinition;
	try {
		definition = parseTestYaml(await readFile(join(directory, 'test.yaml'), 'utf8'));
	} catch {
		return result(directory, [
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
	return result(directory, issues, definition.id);
};

/** Validates installed test directories, including those whose YAML cannot be parsed. */
export const validateTests = async (root: string, id?: string): Promise<ValidationResult[]> => {
	const directories = (await discoverTestDirectories(root)).filter(
		(directory) => id === undefined || basename(directory) === id
	);
	if (id !== undefined && directories.length === 0)
		throw new Error(`Test '${id}' is not installed.`);
	const results: ValidationResult[] = [];
	for (const directory of directories) results.push(await validateTest(directory));
	return results;
};

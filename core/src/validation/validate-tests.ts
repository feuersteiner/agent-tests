import { basename } from 'node:path';
import { discoverTestDirectories } from '../discovery/index.js';
import { validateTest } from './validate-test.js';
import type { ValidationResult } from './types.js';

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

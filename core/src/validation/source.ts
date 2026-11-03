import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TestDefinition } from '../schema/index.js';
import type { ValidationIssue } from './types.js';

/** Checks the exact TEST.md bytes against a compiled definition's source hash. */
export const validateSource = async (
	directory: string,
	definition: TestDefinition
): Promise<ValidationIssue[]> => {
	let source: Buffer;
	try {
		source = await readFile(join(directory, 'TEST.md'));
	} catch {
		return [
			{ code: 'source-unreadable', message: 'TEST.md could not be read.', severity: 'error' }
		];
	}
	if (!definition.source)
		return [
			{
				code: 'source-missing',
				message: 'Compile TEST.md to record its source hash.',
				severity: 'error'
			}
		];

	const expected = `sha256:${createHash('sha256').update(source).digest('hex')}`;
	if (definition.source === expected) return [];
	return [
		{ code: 'source-stale', message: 'TEST.md changed; compile the test again.', severity: 'error' }
	];
};

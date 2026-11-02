import { mkdir, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertLocalPath } from './utils.js';
import type { InitResult } from './types.js';

/** Create the project and tests directories; canonicalize root and reject test-path symlinks. */
export const createDirectories = async (result: InitResult): Promise<void> => {
	await mkdir(result.root, { recursive: true });
	result.root = await realpath(result.root);
	const tests = resolve(result.root, '.agents/tests');
	await assertLocalPath(result.root, tests);
	await mkdir(tests, { recursive: true });
};

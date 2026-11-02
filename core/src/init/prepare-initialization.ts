import { resolve } from 'node:path';
import type { InitResult } from './types.js';

/** Prepare result state for a project root without reading or writing the filesystem. */
export const prepareInitialization = (root: string): InitResult => ({
	root: resolve(root),
	created: [],
	skipped: [],
	warnings: [],
	exitCode: 0
});

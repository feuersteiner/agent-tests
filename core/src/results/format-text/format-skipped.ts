import type { SkippedTest } from '../types.js';

/** Render skipped tests with their optional file context and reason. */
export const formatSkipped = (skipped: SkippedTest[]): string[] =>
	skipped.map(
		(skip) => `skip: ${skip.testId}${skip.file ? ` (${skip.file})` : ''}: ${skip.reason}`
	);

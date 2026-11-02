import type { RunResult } from '../types.js';

/** Summarize the checked, finding and skipped counts for the final output line. */
export const summarizeRun = (result: RunResult): string =>
	`${result.checked} checked, ${result.findings.length} findings, ${result.skipped.length} skipped`;

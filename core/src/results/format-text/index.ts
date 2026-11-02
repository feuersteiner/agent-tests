import { formatFindings } from './format-findings.js';
import { formatSkipped } from './format-skipped.js';
import { formatWarnings } from './format-warnings.js';
import { summarizeRun } from './summarize-run.js';
import type { RunResult } from '../types.js';

/** Format explained findings, warnings and skips without terminal escape codes. */
export const formatText = (result: RunResult): string =>
	[
		...formatFindings(result.findings),
		...formatWarnings(result.warnings),
		...formatSkipped(result.skipped),
		summarizeRun(result)
	].join('\n');

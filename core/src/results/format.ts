import type { Finding, RunResult } from './types.js';

const formatFinding = (finding: Finding): string => {
	const location = `${finding.file}:${finding.line}:${finding.column ?? 1}`;
	const rule = `${finding.testId}/${finding.checkId} (${finding.level})`;
	const review = finding.requiresReview ? ' [human review requested]' : '';
	return `${location}  ${finding.severity}  ${finding.message}${review}\n  ${rule}: ${finding.fix}`;
};

/** Format explained findings, warnings and skips without terminal escape codes. */
export const formatText = (result: RunResult): string =>
	[
		...result.findings.map(formatFinding),
		...result.warnings.map((warning) => `warning: ${warning}`),
		...result.skipped.map(
			(skip) => `skip: ${skip.testId}${skip.file ? ` (${skip.file})` : ''}: ${skip.reason}`
		),
		`${result.checked} checked, ${result.findings.length} findings, ${result.skipped.length} skipped`
	].join('\n');

/** Serialize the complete stable result contract for tools and CI. */
export const formatJson = (result: RunResult): string => JSON.stringify(result, null, 2);

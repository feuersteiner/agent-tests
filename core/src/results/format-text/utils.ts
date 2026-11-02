import type { Finding } from '../types.js';

/** Render one finding with its default column, rule identity and optional review marker. */
export const formatFinding = (finding: Finding): string => {
	const location = `${finding.file}:${finding.line}:${finding.column ?? 1}`;
	const rule = `${finding.testId}/${finding.checkId} (${finding.level})`;
	const review = finding.requiresReview ? ' [human review requested]' : '';
	return `${location}  ${finding.severity}  ${finding.message}${review}\n  ${rule}: ${finding.fix}`;
};

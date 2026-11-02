import type { Finding } from '../../results/index.js';
import { escapeData, escapeProperty } from './utils.js';

/** Render one finding as an escaped workflow command; absent columns default to one. */
export const formatAnnotation = (finding: Finding): string => {
	const file = escapeProperty(finding.file);
	const title = escapeProperty(`${finding.testId}/${finding.checkId} (${finding.level})`);
	const message = escapeData(`${finding.message} Fix: ${finding.fix}`);
	return `::${finding.severity} file=${file},line=${finding.line},col=${finding.column ?? 1},title=${title}::${message}`;
};

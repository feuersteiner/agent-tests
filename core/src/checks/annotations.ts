import type { Finding } from '../results/index.js';

const escapeData = (text: string) =>
	text.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
const escapeProperty = (text: string) =>
	escapeData(text).replaceAll(':', '%3A').replaceAll(',', '%2C');

/** Render escaped GitHub workflow commands without writing or logging findings. */
export const formatGitHubAnnotations = (findings: Finding[]): string =>
	findings
		.map((finding) => {
			const file = escapeProperty(finding.file);
			const title = escapeProperty(`${finding.testId}/${finding.checkId} (${finding.level})`);
			const message = escapeData(`${finding.message} Fix: ${finding.fix}`);
			return `::${finding.severity} file=${file},line=${finding.line},col=${finding.column ?? 1},title=${title}::${message}`;
		})
		.join('\n');

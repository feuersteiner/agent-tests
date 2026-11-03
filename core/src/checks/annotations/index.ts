import type { Finding } from '../../results/index.js';
import { formatAnnotation } from './format-annotation.js';

/** Return newline-delimited CI annotations for findings without logging or writing them. */
export const formatGitHubAnnotations = (findings: Finding[]): string =>
	findings.map(formatAnnotation).join('\n');

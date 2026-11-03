import { formatFinding } from './utils.js';
import type { Finding } from '../types.js';

/** Render findings in their original order, including locations and proposed fixes. */
export const formatFindings = (findings: Finding[]): string[] => findings.map(formatFinding);

import type { TestOutcome } from '../schema/index.js';
import type { Finding, SkippedTest } from '../results/index.js';

export interface CheckTarget {
	path: string;
	content: string;
}

export interface CheckEvaluation {
	outcome: TestOutcome;
	findings: Finding[];
	warnings: string[];
	skipped: SkippedTest[];
	checked: number;
}

export interface PatternMatch {
	text: string;
	index: number;
}

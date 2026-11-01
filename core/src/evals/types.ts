import type { ExitCode, Finding } from '../results/index.js';
import type { TestOutcome } from '../schema/index.js';

export interface EvalCaseResult {
	name: string;
	path: string;
	expected: TestOutcome;
	actual: TestOutcome | 'error';
	passed: boolean;
	findings: Finding[];
	warnings: string[];
	unrun?: boolean;
	error?: string;
}

export interface EvalResult {
	testId: string;
	cases: EvalCaseResult[];
	passed: number;
	failed: number;
	skipped: number;
	exitCode: ExitCode;
}

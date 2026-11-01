/** Stable process status: success, findings, or operational failure. */
export type ExitCode = 0 | 1 | 2;
export type FindingLevel = 'fast' | 'smart' | 'deep';
export type Severity = 'error' | 'warning';

/** One explained finding at a source location. */
export interface Finding {
	testId: string;
	checkId: string;
	level: FindingLevel;
	file: string;
	line: number;
	column?: number;
	message: string;
	fix: string;
	severity: Severity;
	requiresReview?: boolean;
}

/** A test deliberately left unexecuted, with its reason. */
export interface SkippedTest {
	testId: string;
	file?: string;
	reason: string;
}

/** Common machine-readable and terminal output from a run. */
export interface RunResult {
	findings: Finding[];
	warnings: string[];
	skipped: SkippedTest[];
	checked: number;
	exitCode: ExitCode;
}

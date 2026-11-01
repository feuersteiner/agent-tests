import type { ExitCode } from '../results/index.js';

export interface ValidationIssue {
	code: string;
	message: string;
	severity: 'error' | 'warning';
	checkId?: string;
	evalName?: string;
}

export interface ValidationResult {
	directory: string;
	testId?: string;
	valid: boolean;
	issues: ValidationIssue[];
	exitCode: ExitCode;
}

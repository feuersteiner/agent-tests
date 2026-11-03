import type { ExitCode, RunResult } from './types.js';

/** Derive an exit status from findings; operational errors always take precedence. */
export const createRunResult = (
	input: Partial<Omit<RunResult, 'exitCode'>> = {},
	error = false
): RunResult => {
	const findings = input.findings ?? [];
	const exitCode: ExitCode = error ? 2 : findings.some((item) => item.severity === 'error') ? 1 : 0;
	return {
		findings,
		warnings: input.warnings ?? [],
		skipped: input.skipped ?? [],
		checked: input.checked ?? 0,
		exitCode
	};
};

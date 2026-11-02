import type { EvalResult } from 'agent-tests';

/** Preserve runtime failures over disagreements when combining per-test outcomes. */
export const combineExitCodes = (results: { exitCode: 0 | 1 | 2 }[]): 0 | 1 | 2 =>
	results.some((result) => result.exitCode === 2)
		? 2
		: results.some((result) => result.exitCode === 1)
			? 1
			: 0;

/** Label warnings visibly in text output; callers retain the same warnings in JSON. */
export const warningsText = (warnings: string[]): string[] =>
	warnings.map((warning) => `warning: ${warning}`);

/** Explain each labeled example, distinguishing skipped work from matched expectations. */
export const formatEvals = (results: EvalResult[]): string =>
	results
		.map((result) =>
			[
				`${result.testId}: ${result.passed} matched expectations, ${result.failed} disagreements, ${result.skipped} skipped outcomes`,
				...result.cases.flatMap((example) => [
					`  ${example.unrun ? 'unrun' : example.passed ? 'match' : 'disagreement'}: ${example.name} (${example.path}); expected ${example.expected}, got ${example.actual}`,
					...(example.error ? [`  error: ${example.error}`] : []),
					...warningsText(example.warnings)
				])
			].join('\n')
		)
		.join('\n');

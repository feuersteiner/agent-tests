import type { CommandOutput } from './types.js';

/** Present serializable public results without loading or exposing configuration state. */
export const present = (
	json: boolean,
	data: unknown,
	text: string,
	exitCode: 0 | 1 | 2 = 0
): CommandOutput => ({ stdout: json ? JSON.stringify(data, null, 2) : text, exitCode });

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

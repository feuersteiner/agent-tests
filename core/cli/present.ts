import type { CommandOutput } from './types.js';

/** Present serializable public results without loading or exposing configuration state. */
export const present = (
	json: boolean,
	data: unknown,
	text: string,
	exitCode: 0 | 1 | 2 = 0
): CommandOutput => ({ stdout: json ? JSON.stringify(data, null, 2) : text, exitCode });

import type { z } from 'zod';

/** Format zod issues as `path: message` lines, naming each unknown field. */
export const describeIssues = (issues: z.core.$ZodIssue[]): string[] =>
	issues.flatMap((issue) => {
		const path = issue.path.map(String);
		if (issue.code === 'unrecognized_keys')
			return issue.keys.map((key) => `${[...path, key].join('.')}: Unknown field`);
		return [`${path.join('.') || 'value'}: ${issue.message}`];
	});

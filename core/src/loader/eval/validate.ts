import { AgentTestEvalSchema } from '../types.ts';
import type { AgentTestEval } from '../types.ts';
import { describeIssues } from '../helpers/issues.ts';

/** Validate a parsed value as an eval, or throw every schema problem as `path: message` lines. */
export const validateEval = (value: unknown): AgentTestEval => {
	const result = AgentTestEvalSchema.safeParse(value);
	if (!result.success) throw new Error(describeIssues(result.error.issues).join('\n'));
	return result.data;
};

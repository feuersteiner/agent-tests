import { z } from 'zod';
import type { AgentTestFinding } from '../assert/types.ts';
import type { AgentTestDefinition } from '../loader/types.ts';

/** What a Test gives on an eval folder: something selected and no finding, a finding, or nothing selected. */
export const OutcomeSchema = z.enum(['pass', 'fail', 'skip'], {
	error: 'Expected pass, fail, or skip'
});
export type AgentTestOutcome = z.infer<typeof OutcomeSchema>;

/** One eval folder as the loader gives it: its id, its path, which the Test runs on as the root, and the outcome its eval.yaml expects. */
export interface AgentTestEvalDefinition {
	id: string;
	root: string;
	expect: AgentTestOutcome;
}

/** One eval's outcome: the eval, its actual outcome, whether it matches the expected outcome, and findings. */
export interface AgentTestEvalResult {
	eval: AgentTestEvalDefinition;
	actual: AgentTestOutcome;
	matches: boolean;
	findings: AgentTestFinding[];
}

/** One Test's outcome in an eval: the Test and the result of each of its evals, empty when it has none. */
export interface AgentTestEvalsResult {
	test: AgentTestDefinition;
	evals: AgentTestEvalResult[];
}

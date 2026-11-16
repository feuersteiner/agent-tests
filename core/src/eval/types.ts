import { z } from 'zod';
import type { AgentTestFinding } from '../assert/types.ts';

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

/** One eval's outcome: the eval, its actual outcome, and findings. */
export interface AgentTestEvalResult {
	eval: AgentTestEvalDefinition;
	actual: AgentTestOutcome;
	findings: AgentTestFinding[];
}

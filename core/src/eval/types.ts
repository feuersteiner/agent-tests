import { z } from 'zod';

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

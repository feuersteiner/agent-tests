import { z } from 'zod';

/** What a Test gives on an eval folder: something selected and no finding, a finding, or nothing selected. */
export const OutcomeSchema = z.enum(['pass', 'fail', 'skip'], {
	error: 'Expected pass, fail, or skip'
});
export type AgentTestOutcome = z.infer<typeof OutcomeSchema>;

import { z } from 'zod';
import type { ResultEntry } from '../shared/types.ts';
import { TextSchema } from '../shared/types.ts';

/** Expected result for a test's labeled file example. */
export const TestOutcomeSchema = z.enum(['pass', 'fail', 'skip']);
export type TestOutcome = z.infer<typeof TestOutcomeSchema>;

/** Labeled file example for a test. Empty file content is valid. */
export const EvalSchema = z.strictObject({
	name: TextSchema,
	path: TextSchema,
	content: z.string(),
	expect: TestOutcomeSchema
});
export type Eval = z.infer<typeof EvalSchema>;

/** Evals retain the actual outcome as well as the declared expectation. */
export type EvalResultEntry = ResultEntry<Eval> & { actual: TestOutcome };
export type EvalResult = { flagged: EvalResultEntry[]; cleared: EvalResultEntry[] };

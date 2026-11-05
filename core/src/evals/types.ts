import { z } from 'zod';
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

/** What one example was expected to do and what it actually did. */
export type EvalResult = { name: string; expect: TestOutcome; actual: TestOutcome };

import { z } from 'zod'
import { text } from './primitives.ts'

/** Expected result for a test's labeled file example. */
export const TestOutcomeSchema = z.enum(['pass', 'fail', 'unsure', 'skip'])
export type TestOutcome = z.infer<typeof TestOutcomeSchema>

/** Labeled file example for a test. Empty file content is valid. */
export const EvalSchema = z.strictObject({
	name: text,
	path: text,
	content: z.string(),
	expect: TestOutcomeSchema
})
export type Eval = z.infer<typeof EvalSchema>

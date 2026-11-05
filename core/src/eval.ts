import { z } from 'zod';
import type { TestsCheck } from './check/index.ts';
import { TextSchema } from './shared/types.ts';
import { Source } from './shared/source.ts';
import type { TestsTrigger } from './trigger/index.ts';

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

export class TestsEval {
	constructor(public readonly evals: Eval[]) {}

	public readonly run = (trigger: TestsTrigger, check: TestsCheck): Promise<EvalResult[]> =>
		Promise.all(
			this.evals.map(async (example) => ({
				name: example.name,
				expect: example.expect,
				actual: await this.outcome(example, trigger, check)
			}))
		);

	/** Skip when no trigger selects the example; otherwise fail if any check fails it. */
	public readonly outcome = async (
		example: Eval,
		trigger: TestsTrigger,
		check: TestsCheck
	): Promise<TestOutcome> => {
		const source = new Source(example.path, async () => example.content);
		const selected = await trigger.run([source]);
		if (selected.length === 0) return 'skip';
		const passed = await check.run(selected);
		return passed.length === 0 ? 'fail' : 'pass';
	};
}

import type { TestsCheck } from '../check/index.ts';
import { Source } from '../shared/source.ts';
import type { TestsTrigger } from '../trigger/index.ts';
import type { Eval, EvalResult, TestOutcome } from './types.ts';

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
		const result = await check.run(selected);
		return result.flagged.length > 0 ? 'fail' : 'pass';
	};
}

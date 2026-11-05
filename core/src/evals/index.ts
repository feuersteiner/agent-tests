import type { TestsCheck } from '../check/index.ts';
import { Source } from '../shared/source.ts';
import type { Result, ResultEntry } from '../shared/types.ts';
import type { TestsTrigger } from '../trigger/index.ts';
import type { Eval, TestOutcome } from './types.ts';

export class TestsEval {
	constructor(public readonly evals: Eval[]) {}

	/** An eval is flagged when its example does not match its label; `trace` says what happened. */
	public readonly run = async (trigger: TestsTrigger, check: TestsCheck): Promise<Result<Eval>> => {
		const flagged: ResultEntry<Eval>[] = [];
		const cleared: ResultEntry<Eval>[] = [];

		await Promise.all(
			this.evals.map(async (example) => {
				const source = new Source(example.path, async () => example.content);
				const actual = await this.outcome(source, trigger, check);
				const isFlagged = actual !== example.expect;
				const trace = isFlagged ? [`expected ${example.expect}, got ${actual}`] : [];
				const entry = { source, check: example, flagged: isFlagged, trace };
				(isFlagged ? flagged : cleared).push(entry);
			})
		);

		return { flagged, cleared };
	};

	/** Skip when no trigger selects the source; otherwise fail if any check fails it. */
	public readonly outcome = async (
		source: Source,
		trigger: TestsTrigger,
		check: TestsCheck
	): Promise<TestOutcome> => {
		const selected = trigger.selected([source], await trigger.run([source]));
		if (selected.length === 0) return 'skip';
		const result = await check.run(selected);
		return result.flagged.length > 0 ? 'fail' : 'pass';
	};
}

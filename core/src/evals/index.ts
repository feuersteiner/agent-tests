import type { TestCheck } from '../check/index.ts';
import { type Source, InMemorySource } from '../shared/sources/index.ts';
import type { Result, ResultEntry } from '../shared/types.ts';
import type { TestTrigger } from '../trigger/index.ts';
import type { Eval, TestOutcome } from './types.ts';

export class TestEval {
	constructor(public readonly evals: Eval[]) {}

	/** An eval is flagged when its example does not match its label; verbose logs each as it finishes. */
	public readonly run = async (
		trigger: TestTrigger,
		check: TestCheck,
		verbose = false
	): Promise<Result<Eval>> => {
		const flagged: ResultEntry<Eval>[] = [];
		const cleared: ResultEntry<Eval>[] = [];

		await Promise.all(
			this.evals.map(async (example) => {
				const source = new InMemorySource(example.path, example.content);
				const actual = await this.outcome(source, trigger, check);
				const isFlagged = actual !== example.expect;
				const trace = isFlagged ? [`expected ${example.expect}, got ${actual}`] : [];
				const entry = { source, check: example, flagged: isFlagged, trace };
				(isFlagged ? flagged : cleared).push(entry);
				if (verbose) this.log(entry);
			})
		);

		return { flagged, cleared };
	};

	private readonly log = ({ source, check, flagged, trace }: ResultEntry<Eval>): void => {
		const status = flagged ? 'flagged' : 'cleared';
		console.log(`eval ${source.path} ${status} ${check.name} ${trace.join(', ')}`.trimEnd());
	};

	/** Skip when no trigger selects the source; otherwise fail if any check fails it. */
	public readonly outcome = async (
		source: Source,
		trigger: TestTrigger,
		check: TestCheck
	): Promise<TestOutcome> => {
		const selected = trigger.selected([source], await trigger.run([source]));
		if (selected.length === 0) return 'skip';
		const result = await check.run(selected);
		return result.flagged.length > 0 ? 'fail' : 'pass';
	};
}

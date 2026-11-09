import type { TestCheck } from '../check/index.ts';
import type { Source } from '../shared/source.ts';
import type { Result, ResultEntry } from '../shared/types.ts';
import type { TestSelect } from '../select/index.ts';
import { exampleSource } from './source.ts';
import type { Eval, TestOutcome } from './types.ts';

export class TestEval {
	constructor(public readonly evals: Eval[]) {}

	/** An eval is flagged when its example does not match its label; verbose logs each as it finishes. */
	public readonly run = async (
		select: TestSelect,
		check: TestCheck,
		verbose = false
	): Promise<Result<Eval>> => {
		const flagged: ResultEntry<Eval>[] = [];
		const cleared: ResultEntry<Eval>[] = [];

		await Promise.all(
			this.evals.map(async (example) => {
				const source = exampleSource(example);
				const actual = await this.outcome(source, select, check);
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

	/** Skip when selection is empty; otherwise fail if any selected target fails a check. */
	public readonly outcome = async (
		source: Source,
		select: TestSelect,
		check: TestCheck
	): Promise<TestOutcome> => {
		const selected = select.selected(await select.run([source]));
		if (selected.length === 0) return 'skip';
		const result = await check.run(selected);
		return result.flagged.length > 0 ? 'fail' : 'pass';
	};
}

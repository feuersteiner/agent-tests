import type { TestCheck } from '../check/index.ts';
import { Source } from '../shared/source.ts';
import type { TestTrigger } from '../trigger/index.ts';
import type { Eval, EvalResult, EvalResultEntry, TestOutcome } from './types.ts';

export class TestEval {
	constructor(public readonly evals: Eval[]) {}

	/** An eval is flagged when its example does not match its label; verbose logs each as it finishes. */
	public readonly run = async (
		trigger: TestTrigger,
		check: TestCheck,
		verbose = false
	): Promise<EvalResult> => {
		const flagged: EvalResultEntry[] = [];
		const cleared: EvalResultEntry[] = [];

		await Promise.all(
			this.evals.map(async (example) => {
				const source = new Source(example.path, async () => example.content);
				const { actual, trace } = await this.inspect(source, trigger, check);
				const isFlagged = actual !== example.expect;
				if (isFlagged) trace.push(`expected ${example.expect}, got ${actual}`);
				const entry = { source, check: example, flagged: isFlagged, actual, trace };
				(isFlagged ? flagged : cleared).push(entry);
				if (verbose) this.log(entry);
			})
		);

		return { flagged, cleared };
	};

	private readonly log = ({ source, check, flagged, trace }: EvalResultEntry): void => {
		const status = flagged ? 'flagged' : 'cleared';
		console.log(`eval ${source.path} ${status} ${check.name} ${trace.join(', ')}`.trimEnd());
	};

	/** Skip when no trigger selects the source; otherwise fail if any check fails it. */
	public readonly outcome = async (
		source: Source,
		trigger: TestTrigger,
		check: TestCheck
	): Promise<TestOutcome> => {
		return (await this.inspect(source, trigger, check)).actual;
	};

	private readonly inspect = async (
		source: Source,
		trigger: TestTrigger,
		check: TestCheck
	): Promise<{ actual: TestOutcome; trace: string[] }> => {
		const triggered = await trigger.run([source]);
		const selected = trigger.selected([source], triggered);
		const trace = [...triggered.flagged, ...triggered.cleared].flatMap((entry) =>
			entry.trace.map((message) => `trigger ${entry.check.id}: ${message}`)
		);
		if (selected.length === 0) return { actual: 'skip', trace };
		const result = await check.run(selected);
		trace.push(
			...[...result.flagged, ...result.cleared].flatMap((entry) =>
				entry.trace.map((message) => `check ${entry.check.id}: ${message}`)
			)
		);
		return { actual: result.flagged.length > 0 ? 'fail' : 'pass', trace };
	};
}

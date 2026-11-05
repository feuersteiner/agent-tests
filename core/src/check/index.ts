import type { Source } from '../shared/source.ts';
import CheckRules from './rules.ts';
import type { Result, ResultEntry } from '../shared/types.ts';
import type { Check, CheckConfig } from './types.ts';

export class TestCheck {
	constructor(
		public readonly checks: Check[],
		public readonly config: CheckConfig
	) {}

	/** One entry for every source and check, in the order they finish; verbose logs each as it does. */
	public readonly run = async (sources: Source[], verbose = false): Promise<Result<Check>> => {
		const flagged: ResultEntry<Check>[] = [];
		const cleared: ResultEntry<Check>[] = [];

		await Promise.all(
			sources.flatMap((source) =>
				this.checks.map(async (check) => {
					const entry = await this.runCheck(source, check);
					(entry.flagged ? flagged : cleared).push(entry);
					if (verbose) this.log(entry);
				})
			)
		);

		return { flagged, cleared };
	};

	private readonly log = ({ source, check, flagged, trace }: ResultEntry<Check>): void => {
		const status = flagged ? `flagged ${check.id}: ${check.error}` : `cleared ${check.id}`;
		console.log(`check ${source.path} ${status} ${trace.join(', ')}`.trimEnd());
	};

	/** The first rule the source passes ends the check; failing every rule present fails it. */
	public readonly runCheck = async (source: Source, check: Check): Promise<ResultEntry<Check>> => {
		const trace: string[] = [];
		const failsGrep: boolean = check.grep
			? await CheckRules.GrepRule(source, check.grep, this.config, trace)
			: true;
		if (!failsGrep) return { source, check, flagged: false, trace };
		const failsAsk: boolean = check.ask
			? await CheckRules.AskRule(source, check.ask, this.config, trace)
			: true;
		if (!failsAsk) return { source, check, flagged: false, trace };
		const failsReason: boolean = check.reason
			? await CheckRules.ReasonRule(source, check.reason, this.config, trace)
			: true;
		return { source, check, flagged: failsReason, trace };
	};
}

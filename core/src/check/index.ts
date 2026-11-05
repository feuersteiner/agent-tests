import type { Source } from '../shared/source.ts';
import CheckRules from './rules.ts';
import type { Check, CheckConfig, CheckResult } from './types.ts';

export class TestsCheck {
	constructor(
		public readonly checks: Check[],
		public readonly config: CheckConfig
	) {}

	/** One result for every source and check, ordered by source and then check. */
	public readonly run = (sources: Source[]): Promise<CheckResult[]> =>
		Promise.all(
			sources.flatMap((source) => this.checks.map((check) => this.runCheck(source, check)))
		);

	/** The first rule the source passes ends the check; failing every rule present fails it. */
	public readonly runCheck = async (source: Source, check: Check): Promise<CheckResult> => {
		const failsGrep: boolean = check.grep
			? await CheckRules.GrepRule(source, check.grep, this.config)
			: true;
		if (!failsGrep) return { source, check, outcome: 'pass', rule: 'grep' };
		const failsAsk: boolean = check.ask
			? await CheckRules.AskRule(source, check.ask, this.config)
			: true;
		if (!failsAsk) return { source, check, outcome: 'pass', rule: 'ask' };
		const failsReason: boolean = check.reason
			? await CheckRules.ReasonRule(source, check.reason, this.config)
			: true;
		if (!failsReason) return { source, check, outcome: 'pass', rule: 'reason' };
		const rule = check.reason ? 'reason' : check.ask ? 'ask' : 'grep';
		return { source, check, outcome: 'fail', rule, message: check.error };
	};
}

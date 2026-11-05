import type { Source } from '../shared/source.ts';
import CheckRules from './rules.ts';
import type { Check, CheckConfig } from './types.ts';

export class TestsCheck {
	constructor(
		public readonly checks: Check[],
		public readonly config: CheckConfig
	) {}

	public readonly run = async (sources: Source[]): Promise<Source[]> => {
		const failedPerSource = await Promise.all(
			sources.map(async (source) =>
				(await Promise.all(this.checks.map((check) => this.failCheck(source, check)))).some(Boolean)
			)
		);

		return sources.filter((_, index) => !failedPerSource[index]);
	};

	public readonly failCheck = async (source: Source, check: Check): Promise<boolean> => {
		const failsGrep: boolean = check.grep
			? await CheckRules.GrepRule(source, check.grep, this.config)
			: true;
		if (!failsGrep) return false;
		const failsAsk: boolean = check.ask
			? await CheckRules.AskRule(source, check.ask, this.config)
			: true;
		if (!failsAsk) return false;
		const failsReason: boolean = check.reason
			? await CheckRules.ReasonRule(source, check.reason, this.config)
			: true;
		return failsReason;
	};
}

import type { Source } from '../shared/source.ts';
import TriggerFilters from './filters.ts';
import type { Result, ResultEntry } from '../shared/types.ts';
import type { FilterConfig, Trigger } from './types.ts';

export class TestTrigger {
	constructor(
		public readonly triggers: Trigger[],
		public readonly config: FilterConfig
	) {}

	/** One entry for every trigger and source, in the order they finish. */
	public readonly run = async (sources: Source[]): Promise<Result<Trigger>> => {
		const flagged: ResultEntry<Trigger>[] = [];
		const cleared: ResultEntry<Trigger>[] = [];

		await Promise.all(
			this.triggers.flatMap((trigger) =>
				sources.map(async (source) => {
					const entry = await this.runTrigger(source, trigger);
					(entry.flagged ? flagged : cleared).push(entry);
				})
			)
		);

		return { flagged, cleared };
	};

	/** Every source when there are no triggers; otherwise those passing any trigger, once each. */
	public readonly selected = (sources: Source[], result: Result<Trigger>): Source[] => {
		if (this.triggers.length === 0) return sources;
		return [...new Map(result.flagged.map(({ source }) => [source.path, source])).values()];
	};

	/** The first filter the source fails ends the trigger; passing every filter present passes it. */
	public readonly runTrigger = async (
		source: Source,
		trigger: Trigger
	): Promise<ResultEntry<Trigger>> => {
		const trace: string[] = [];
		const glob: boolean = trigger.glob
			? await TriggerFilters.GlobFilter(source, trigger.glob, this.config, trace)
			: true;
		if (!glob) return { source, check: trigger, flagged: false, trace };
		const grep: boolean = trigger.grep
			? await TriggerFilters.GrepFilter(source, trigger.grep, this.config, trace)
			: true;
		if (!grep) return { source, check: trigger, flagged: false, trace };
		const ask: boolean = trigger.ask
			? await TriggerFilters.AskFilter(source, trigger.ask, this.config, trace)
			: true;
		return { source, check: trigger, flagged: ask, trace };
	};
}

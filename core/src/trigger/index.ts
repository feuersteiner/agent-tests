import type { Source } from '../shared/source.ts';
import TriggerFilters from './filters.ts';
import type { Result, ResultEntry } from '../shared/types.ts';
import type { FilterConfig, Trigger } from './types.ts';

export class TestTrigger {
	constructor(
		public readonly triggers: Trigger[],
		public readonly config: FilterConfig
	) {}

	/** One entry for every trigger and source, in the order they finish; verbose logs each as it does. */
	public readonly run = async (sources: Source[], verbose = false): Promise<Result<Trigger>> => {
		const flagged: ResultEntry<Trigger>[] = [];
		const cleared: ResultEntry<Trigger>[] = [];

		await Promise.all(
			this.triggers.flatMap((trigger) =>
				sources.map(async (source) => {
					const entry = await this.runTrigger(source, trigger);
					(entry.flagged ? flagged : cleared).push(entry);
					if (verbose) this.log(entry);
				})
			)
		);

		return { flagged, cleared };
	};

	private readonly log = ({ source, check, flagged, trace }: ResultEntry<Trigger>): void => {
		const status = flagged ? 'flagged' : 'cleared';
		console.log(`trigger ${source.path} ${status} ${check.id} ${trace.join(', ')}`.trimEnd());
	};

	/** Every source when there are no triggers; otherwise those passing any trigger, once each. */
	public readonly selected = (sources: Source[], result: Result<Trigger>): Source[] => {
		const paths = new Set(result.flagged.map(({ source }) => source.path));
		return [
			...new Map(
				sources
					.filter((source) => this.triggers.length === 0 || paths.has(source.path))
					.map((source) => [source.path, source])
			).values()
		];
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

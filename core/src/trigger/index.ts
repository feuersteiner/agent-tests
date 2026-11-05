import type { Source } from '../shared/source.ts';
import TriggerFilters from './filters.ts';
import type { FilterConfig, Trigger } from './types.ts';

export class TestsTrigger {
	constructor(
		public readonly triggers: Trigger[],
		public readonly config: FilterConfig
	) {}

	public readonly run = async (sources: Source[]): Promise<Source[]> => {
		if (this.triggers.length === 0) return sources;
		const filteredSourcesPerTrigger = (
			await Promise.all(
				this.triggers.flatMap((trigger) =>
					sources.map(async (source) => ((await this.passTrigger(source, trigger)) ? [source] : []))
				)
			)
		).flat();

		return [...new Map(filteredSourcesPerTrigger.map((source) => [source.path, source])).values()];
	};

	public readonly passTrigger = async (source: Source, trigger: Trigger): Promise<boolean> => {
		const glob: boolean = trigger.glob
			? await TriggerFilters.GlobFilter(source, trigger.glob, this.config)
			: true;
		if (!glob) return false;
		const grep: boolean = trigger.grep
			? await TriggerFilters.GrepFilter(source, trigger.grep, this.config)
			: true;
		if (!grep) return false;
		const ask: boolean = trigger.ask
			? await TriggerFilters.AskFilter(source, trigger.ask, this.config)
			: true;
		return ask;
	};
}

import type { AgentTestEngines } from '../engines/types.ts';
import type { Source } from '../sources/index.ts';
import type { AgentTestSelect, AgentTestSelectConfig } from './types.ts';

/** Picks the sources one Test inspects. */
export class Selector {
	constructor(
		private readonly select: AgentTestSelect | undefined,
		private readonly engines: AgentTestEngines,
		private readonly config: AgentTestSelectConfig
	) {}

	/** The sources this Test inspects, in input order; every source when the Test has no select. */
	public readonly run = async (sources: Source[]): Promise<Source[]> => {
		if (!this.select) return [...sources];
		const selected = await Promise.all(sources.map(this.isSelected));
		return sources.filter((_, index) => selected[index]);
	};

	/** A source passes glob, then grep, then decide; the first failure stops it. */
	private readonly isSelected = async (source: Source): Promise<boolean> =>
		(await this.passesGlob(source)) &&
		(await this.passesGrep(source)) &&
		(await this.passesDecide(source));

	/** Passes when the select has no glob or the source path matches it. */
	private readonly passesGlob = async (source: Source): Promise<boolean> => {
		const glob = this.select?.glob;
		if (glob === undefined) return true;
		return (await this.engines.glob(source.path, glob)) === 1;
	};

	/** Passes when the select has no grep or the content matches it at least once. */
	private readonly passesGrep = async (source: Source): Promise<boolean> => {
		const grep = this.select?.grep;
		if (grep === undefined) return true;
		return (await this.engines.grep(source.open(), grep)) > 0;
	};

	/** Passes when the select has no decide or the content scores at least the threshold. */
	private readonly passesDecide = async (source: Source): Promise<boolean> => {
		const decide = this.select?.decide;
		if (decide === undefined) return true;
		return (await this.engines.decide(source.open(), decide)) >= this.config.threshold;
	};
}

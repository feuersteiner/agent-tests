import type { AgentTestEngines } from '../engines/types.ts';
import type { Source } from '../sources/index.ts';
import type { AgentTestSelect, AgentTestSelectConfig } from './types.ts';

/** Picks the sources one Test inspects. */
export class SelectOrchestrator {
	constructor(
		private readonly select: AgentTestSelect | undefined,
		private readonly engines: AgentTestEngines,
		private readonly config: AgentTestSelectConfig
	) {}

	/** The sources this Test inspects, in input order; every source when the Test has no select. */
	public readonly run = async (sources: Source[]): Promise<Source[]> => {
		console.log(`Selecting among ${sources.length} source(s)`);
		const flagged = this.select
			? await Promise.all(sources.map(this.isFlagged))
			: sources.map(() => true);
		const selected = sources.filter((_, index) => flagged[index]);
		console.log(`${selected.length} of ${sources.length} source(s) selected`);
		return selected;
	};

	/** Flagged, meaning selected for this Test, when the source passes glob, then grep, then decide; the first failure stops it. A flagged source is logged. */
	private readonly isFlagged = async (source: Source): Promise<boolean> => {
		const flagged =
			(await this.passesGlob(source)) &&
			(await this.passesGrep(source)) &&
			(await this.passesDecide(source));
		if (flagged) console.log(`${source.path} has been selected`);
		return flagged;
	};

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

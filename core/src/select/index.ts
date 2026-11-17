import type { AgentTestEngines } from '../engines/types.ts';
import type { Source } from '../sources/index.ts';
import type { AgentTestSelect, AgentTestSelectConfig } from './types.ts';

/** Picks the sources a Test inspects. */
export class SelectOrchestrator {
	constructor(
		private readonly engines: AgentTestEngines,
		private readonly config: AgentTestSelectConfig
	) {}

	/** The sources the Test's select keeps, in input order; every source when the Test has no select. */
	public readonly run = async (
		select: AgentTestSelect | undefined,
		sources: Source[]
	): Promise<Source[]> => {
		console.log(`Selecting among ${sources.length} source(s)`);
		const flagged = select
			? await Promise.all(sources.map((source) => this.isFlagged(source, select)))
			: sources.map(() => true);
		const selected = sources.filter((_, index) => flagged[index]);
		console.log(`${selected.length} of ${sources.length} source(s) selected`);
		return selected;
	};

	/** Flagged, meaning selected for the Test, when the source passes glob, then grep, then decide; the first failure stops it. A flagged source is logged. */
	private readonly isFlagged = async (
		source: Source,
		select: AgentTestSelect
	): Promise<boolean> => {
		const flagged =
			(await this.passesGlob(source, select)) &&
			(await this.passesGrep(source, select)) &&
			(await this.passesDecide(source, select));
		if (flagged) console.log(`${source.path} has been selected`);
		return flagged;
	};

	/** Passes when the select has no glob or the source path matches it. */
	private readonly passesGlob = async (
		source: Source,
		{ glob }: AgentTestSelect
	): Promise<boolean> => {
		if (glob === undefined) return true;
		return (await this.engines.glob(source.path, glob)) === 1;
	};

	/** Passes when the select has no grep or the content matches it at least once. */
	private readonly passesGrep = async (
		source: Source,
		{ grep }: AgentTestSelect
	): Promise<boolean> => {
		if (grep === undefined) return true;
		return (await this.engines.grep(source.open(), grep)) > 0;
	};

	/** Passes when the select has no decide or the content scores at least the threshold. */
	private readonly passesDecide = async (
		source: Source,
		{ decide }: AgentTestSelect
	): Promise<boolean> => {
		if (decide === undefined) return true;
		return (await this.engines.decide(source.open(), decide)) >= this.config.threshold;
	};
}

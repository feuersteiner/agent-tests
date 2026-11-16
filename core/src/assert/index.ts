import type { AgentTestEngines } from '../engines/types.ts';
import type { Source } from '../sources/index.ts';
import type {
	AgentTestAssert,
	AgentTestAssertConfig,
	AgentTestAssertion,
	AgentTestFinding
} from './types.ts';

/** Judges the sources one Test inspects. */
export class AssertOrchestrator {
	constructor(
		private readonly assert: AgentTestAssert,
		private readonly engines: AgentTestEngines,
		private readonly config: AgentTestAssertConfig
	) {}

	/** One finding for every source and assertion that fails, ordered by source, then assertion. */
	public readonly run = async (sources: Source[]): Promise<AgentTestFinding[]> => {
		console.log(`Asserting ${sources.length} source(s) against ${this.assert.length} assertion(s)`);
		const pairs = sources.flatMap((source) =>
			this.assert.map((assertion) => ({ source, assertion }))
		);
		const flagged = await Promise.all(
			pairs.map(({ source, assertion }) => this.isFlagged(source, assertion))
		);
		const findings = pairs.filter((_, index) => flagged[index]);
		const failed = new Set(findings.map(({ source }) => source)).size;
		console.log(`${failed} of ${sources.length} source(s) failed`);
		return findings;
	};

	/** Flagged when the source fails grep, then decide, then reason; the first stage that clears it stops the escalation. A flagged source is logged. */
	private readonly isFlagged = async (
		source: Source,
		assertion: AgentTestAssertion
	): Promise<boolean> => {
		const flagged =
			(await this.failsGrep(source, assertion)) &&
			(await this.failsDecide(source, assertion)) &&
			(await this.failsReason(source, assertion));
		if (flagged) console.log(`${source.path} has failed ${assertion.id}`);
		return flagged;
	};

	/** Fails when the assertion has no grep or the content matches it at least once. */
	private readonly failsGrep = async (
		source: Source,
		{ grep }: AgentTestAssertion
	): Promise<boolean> => {
		if (grep === undefined) return true;
		return (await this.engines.grep(source.open(), grep)) > 0;
	};

	/** Fails when the assertion has no decide or the content scores below the threshold. */
	private readonly failsDecide = async (
		source: Source,
		{ decide }: AgentTestAssertion
	): Promise<boolean> => {
		if (decide === undefined) return true;
		return (await this.engines.decide(source.open(), decide)) < this.config.threshold;
	};

	/** Fails when the assertion has no reason or the content scores below the threshold. */
	private readonly failsReason = async (
		source: Source,
		{ reason }: AgentTestAssertion
	): Promise<boolean> => {
		if (reason === undefined) return true;
		return (await this.engines.reason(source.open(), reason)) < this.config.threshold;
	};
}

import { AI } from './index.ts';
import type { AiConfig, AiExplanation, AiRequest, FailInstance } from './types.ts';

/** Deterministic test double without SDK imports or network access. */
export class StubAI extends AI {
	constructor(
		private readonly value = 0.9,
		private readonly failures: FailInstance[] = []
	) {
		super();
	}
	/** Return the configured score; the base class still validates its range. */
	protected override async score(_request: AiRequest, _config: AiConfig): Promise<number> {
		return this.value;
	}

	/** Preserve the supplied score without reasons, evidence, or a second scoring call. */
	protected override async explainScore(
		_request: AiRequest,
		score: number,
		_config: AiConfig
	): Promise<AiExplanation> {
		return { score, failures: this.failures };
	}
}

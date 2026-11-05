import { AI } from './index.ts';
import type { AiConfig, AiExplanation, AiRequest } from './types.ts';

/** WIP implementation: random dummy scoring and empty explanations without SDK imports. */
export class StubAI extends AI {
	/** Validated request/config are unused; preserve the current random scoring behavior. */
	protected override async score(_request: AiRequest, _config: AiConfig): Promise<number> {
		return Math.random() > 0.5 ? 0.9 : 0.1;
	}

	/** Preserve the supplied score without reasons, evidence, or a second scoring call. */
	protected override async explainScore(
		_request: AiRequest,
		score: number,
		_config: AiConfig
	): Promise<AiExplanation> {
		return { score, failures: [] };
	}
}

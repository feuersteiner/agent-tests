import { DecisionalAiEngine } from './decision.ts';
import { ReasoningAiEngine } from './reasoning.ts';
import { GlobEngine } from './glob.ts';
import { GrepEngine } from './grep.ts';
import type { AiSettings } from './types.ts';

export { AIEngine } from './ai.ts';
export { DecisionalAiEngine, ReasoningAiEngine, GlobEngine, GrepEngine };
export * from './types.ts';

/** Shared engines; deterministic matchers do not depend on AI providers. */
export class Engines {
	public readonly decision: DecisionalAiEngine;
	public readonly reasoning: ReasoningAiEngine;
	public readonly glob = new GlobEngine();
	public readonly grep = new GrepEngine();

	constructor(config: AiSettings) {
		this.decision = new DecisionalAiEngine(config.decision);
		this.reasoning = new ReasoningAiEngine(config.reasoning);
	}
}

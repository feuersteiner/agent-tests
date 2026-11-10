import { DecideAIEngine } from './engines/decide.ts';
import type { AIEngine } from './engines/index.ts';
import { ReasonAIEngine } from './engines/reason.ts';
import type { AiSettings } from './types.ts';

export * from './types.ts';

/** One configured pair of engines; required environment keys are resolved eagerly. */
export class AI {
	public readonly decide: AIEngine;
	public readonly reason: AIEngine;

	constructor(config: AiSettings) {
		this.decide = new DecideAIEngine(config.decision);
		this.reason = new ReasonAIEngine(config.reasoning);
	}
}

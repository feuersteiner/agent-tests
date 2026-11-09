import { Engines } from '../engines/index.ts';

export * from './types.ts';

/** One configured pair of engines; required environment keys are resolved eagerly. */
export class AI extends Engines {
	public get decide() {
		return this.decision;
	}
	public get reason() {
		return this.reasoning;
	}
}

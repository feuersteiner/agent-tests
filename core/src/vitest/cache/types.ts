import type { DecisionModel, DecisionResponse } from '../../models/index.js';

/** Process-local in-flight requests share a disk cache scoped to one model identity. */
export interface CachedModelState {
	model: DecisionModel;
	directory: string;
	identity: unknown;
	pending: Map<string, Promise<DecisionResponse>>;
}

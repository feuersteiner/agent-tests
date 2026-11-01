/** Input exposed to a decision model; callers control which file data is included. */
export interface DecisionRequest {
	ask: string;
	path?: string;
	content?: string;
	level?: 'trigger' | 'smart' | 'deep';
	reasoning?: 'low' | 'medium' | 'high';
	hints?: string[];
}

/** Evidence quoted by a model; line numbers are one-based when supplied. */
export interface DecisionMatch {
	text: string;
	line?: number;
	message?: string;
}

/** Confidence describes the probability of a violation, rather than confidence in a pass. */
export interface DecisionResponse {
	decision: 'pass' | 'fail' | 'unsure';
	confidence?: number;
	message?: string;
	matches?: DecisionMatch[];
}

/** Injectable model contract used by triggers, checks and offline tests. */
export interface DecisionModel {
	decide: (request: DecisionRequest) => Promise<DecisionResponse>;
}

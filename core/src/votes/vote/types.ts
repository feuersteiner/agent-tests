import type { VoteResult } from '../types.js';

/** Requested state plus an optional result requiring no mutation. */
export interface VoteDecision {
	desired: boolean;
	result?: VoteResult;
}

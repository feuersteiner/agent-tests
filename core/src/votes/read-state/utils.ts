import type { PendingVote, VoteState } from '../types.js';
import type { ScoreState, VoteSnapshot } from './types.js';

/**
 * Assemble validated reads, omitting the optional pending field when no vote exists.
 * @param snapshot Pinned repository and voter metadata.
 * @param score Validated CSV contents and membership.
 * @param pending Optional author-owned pending PR.
 * @returns Complete immutable input for vote decisions and writes.
 */
export const buildVoteState = (
	snapshot: VoteSnapshot,
	score: ScoreState,
	pending?: PendingVote
): VoteState => ({
	...snapshot,
	...score,
	...(pending ? { pending } : {})
});

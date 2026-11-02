import { readVoteState } from '../read-state/index.js';
import { prepareVote } from './utils.js';
import { decideVote } from './decide-vote.js';
import { applyVoteDecision } from './apply-vote-decision.js';
import type { VoteOptions, VoteResult } from '../types.js';

/**
 * Toggle or set only the authenticated user's vote through a GitHub pull request.
 * @param id Lowercase kebab-case library test ID.
 * @param options Repository, direction and optional injected GitHub transport.
 * @returns An unchanged, closed or opened vote result with exit code zero.
 * @throws Rejects invalid inputs, ambiguous pending votes or unsafe score data before
 * mutation. Transport failures can leave a closed PR, fork, branch or commit in place.
 */
export const voteTest = async (id: string, options: VoteOptions = {}): Promise<VoteResult> => {
	const { repository, gh } = prepareVote(id, options);
	const state = await readVoteState(repository, id, gh);
	const decision = decideVote(state, id, options);
	if (decision.result) return decision.result;
	return applyVoteDecision(state, id, decision.desired, gh);
};

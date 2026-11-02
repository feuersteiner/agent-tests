import { openVote } from '../open-vote/index.js';
import type { GhRunner, VoteResult, VoteState } from '../types.js';

/**
 * Close an obsolete pending vote, then open a new vote only when still necessary.
 * @param state Validated main snapshot and optional pending PR.
 * @param id Library test ID.
 * @param desired Requested vote state.
 * @param gh Mutation-capable injected transport.
 * @returns A closed or opened result.
 * @throws Propagates transport failures; a successfully closed PR remains closed.
 */
export const applyVoteDecision = async (
	state: VoteState,
	id: string,
	desired: boolean,
	gh: GhRunner
): Promise<VoteResult> => {
	if (state.pending) {
		await gh(['pr', 'close', String(state.pending.number), '--repo', state.repository]);
		if (desired === state.current)
			return {
				action: 'closed',
				vote: desired,
				url: state.pending.url,
				message: 'Closed the pending vote; the main-branch vote is unchanged.',
				exitCode: 0
			};
	}
	return openVote(state, id, desired, gh);
};

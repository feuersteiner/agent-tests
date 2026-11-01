import { runGh, validateTarget } from './github.js';
import { openVote } from './open-vote.js';
import { readVoteState } from './read-state.js';
import type { VoteOptions, VoteResult } from './types.js';

/** Toggle or set the authenticated user's vote; close a pending vote to restore main's state. */
export const voteTest = async (id: string, options: VoteOptions = {}): Promise<VoteResult> => {
	const repository = options.repository ?? 'feuersteiner/agent-tests';
	validateTarget(repository, id);
	if (options.up && options.down) throw new Error('Choose only one of --up and --down.');
	const gh = options.gh ?? runGh;
	const state = await readVoteState(repository, id, gh);
	const effective = state.pending ? state.pending.title === `vote: +1 ${id}` : state.current;
	const desired = options.up ? true : options.down ? false : !effective;
	if (desired === effective)
		return {
			action: 'unchanged',
			vote: desired,
			message: 'Your vote already has the requested state.',
			...(state.pending ? { url: state.pending.url } : {}),
			exitCode: 0
		};
	if (state.pending) {
		await gh(['pr', 'close', String(state.pending.number), '--repo', repository]);
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

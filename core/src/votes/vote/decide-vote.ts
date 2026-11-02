import type { VoteOptions, VoteState } from '../types.js';
import type { VoteDecision } from './types.js';

/**
 * Resolve the effective pending/main vote and requested direction without writes.
 * @param state Validated main snapshot and optional author's pending vote.
 * @param id Test ID used for the exact pending title.
 * @param options Explicit up/down direction, or neither to toggle.
 * @returns Desired state and an unchanged result when already satisfied.
 */
export const decideVote = (state: VoteState, id: string, options: VoteOptions): VoteDecision => {
	const effective = state.pending ? state.pending.title === `vote: +1 ${id}` : state.current;
	const desired = options.up ? true : options.down ? false : !effective;
	if (desired === effective)
		return {
			desired,
			result: {
				action: 'unchanged',
				vote: desired,
				message: 'Your vote already has the requested state.',
				...(state.pending ? { url: state.pending.url } : {}),
				exitCode: 0
			}
		};
	return { desired };
};

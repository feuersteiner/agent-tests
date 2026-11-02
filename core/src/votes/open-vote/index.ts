import { writableRepository } from './writable-repository.js';
import { writeVote } from './write-vote.js';
import { createPullRequest } from './create-pull-request.js';
import type { GhRunner, VoteResult, VoteState } from '../types.js';

/**
 * Create one branch, one score-only commit and one PR from a pinned main snapshot.
 * @param state Validated voter, repository and score snapshot.
 * @param id Library test ID.
 * @param vote Desired author row presence.
 * @param gh Injected mutation transport; no local checkout is modified.
 * @returns The opened PR result.
 * @throws Fork validation, score and transport failures propagate without rollback
 * of any previously created fork, branch, commit or PR.
 */
export const openVote = async (
	state: VoteState,
	id: string,
	vote: boolean,
	gh: GhRunner
): Promise<VoteResult> => {
	const repository = await writableRepository(state, gh);
	const branch = await writeVote(state, id, vote, repository, gh);
	return createPullRequest(state, id, vote, repository, branch, gh);
};

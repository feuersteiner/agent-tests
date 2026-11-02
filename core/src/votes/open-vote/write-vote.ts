import { randomUUID } from 'node:crypto';
import { api, updateScore } from '../utils.js';
import type { GhRunner, VoteState } from '../types.js';

/**
 * Create a unique branch at the pinned main commit and write one author-only CSV change.
 * @param state Validated main snapshot and score metadata.
 * @param id Library test ID.
 * @param vote Desired row presence.
 * @param repository Writable upstream or verified fork.
 * @param gh Mutation-capable transport.
 * @returns Created branch name.
 * @throws Propagates score/transport failures; a created branch remains if the commit fails.
 */
export const writeVote = async (
	state: VoteState,
	id: string,
	vote: boolean,
	repository: string,
	gh: GhRunner
): Promise<string> => {
	const branch = `agent-tests/vote-${id}-${state.login.toLowerCase()}-${randomUUID().slice(0, 8)}`;
	await api(gh, `repos/${repository}/git/refs`, 'POST', {
		ref: `refs/heads/${branch}`,
		sha: state.commit
	});
	await api(gh, `repos/${repository}/contents/library/${id}/score.csv`, 'PUT', {
		message: `vote: ${vote ? '+1' : '-1'} ${id}`,
		content: Buffer.from(updateScore(state.score, state.login, vote)).toString('base64'),
		branch,
		...(state.scoreSha ? { sha: state.scoreSha } : {})
	});
	return branch;
};

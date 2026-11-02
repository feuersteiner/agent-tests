import { readSnapshot } from './read-snapshot.js';
import { readScore } from './read-score.js';
import { readPending } from './read-pending.js';
import { buildVoteState } from './utils.js';
import type { GhRunner, VoteState } from '../types.js';

/**
 * Read the voter, pinned main score and author-owned pending vote without writes.
 * @param repository Validated owner/repository.
 * @param id Validated library test ID.
 * @param gh Read-only injected transport.
 * @returns Complete vote state with score reads pinned to one main commit.
 * @throws Rejects malformed identities, unsafe scores and ambiguous pending votes;
 * propagates transport and response failures before any mutation.
 */
export const readVoteState = async (
	repository: string,
	id: string,
	gh: GhRunner
): Promise<VoteState> => {
	const snapshot = await readSnapshot(repository, gh);
	const score = await readScore(snapshot, id, gh);
	const pending = await readPending(snapshot, id, gh);
	return buildVoteState(snapshot, score, pending);
};

import type { GhRunner, PendingVote } from '../types.js';
import type { VoteSnapshot } from './types.js';

/**
 * Find at most one open vote PR with an exact title and the authenticated author.
 * @param snapshot Repository and validated login.
 * @param id Library test ID used in the search and exact title comparison.
 * @param gh Read-only GitHub transport.
 * @returns The author's pending vote, or undefined.
 * @throws Rejects multiple pending votes, malformed JSON and transport failures.
 */
export const readPending = async (
	snapshot: VoteSnapshot,
	id: string,
	gh: GhRunner
): Promise<PendingVote | undefined> => {
	const { repository } = snapshot;
	const output = await gh([
		'pr',
		'list',
		'--repo',
		repository,
		'--state',
		'open',
		'--author',
		snapshot.login,
		'--search',
		`in:title "${id}"`,
		'--limit',
		'1000',
		'--json',
		'number,title,url,author'
	]);
	const pulls = JSON.parse(output) as PendingVote[];
	const pending = pulls.filter(
		(pull) =>
			pull.author.login.toLowerCase() === snapshot.login.toLowerCase() &&
			[pull.title === `vote: +1 ${id}`, pull.title === `vote: -1 ${id}`].some(Boolean)
	);
	if (pending.length > 1)
		throw new Error('Multiple pending votes exist for this test; resolve them first.');
	return pending[0];
};

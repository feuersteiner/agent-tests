import type { GhRunner, VoteResult, VoteState } from '../types.js';

/**
 * Open a PR from the committed vote branch and extract GitHub's returned URL.
 * @param state Source repository, default branch and authenticated login.
 * @param id Library test ID.
 * @param vote Desired row presence.
 * @param repository Writable repository owning the branch.
 * @param branch Already committed vote branch.
 * @param gh Mutation-capable transport.
 * @returns Opened vote result with the parsed URL.
 * @throws Transport or missing-URL failures leave the prior branch/commit in place;
 * the PR may already exist if its response did not contain a recognizable URL.
 */
export const createPullRequest = async (
	state: VoteState,
	id: string,
	vote: boolean,
	repository: string,
	branch: string,
	gh: GhRunner
): Promise<VoteResult> => {
	const output = await gh([
		'pr',
		'create',
		'--repo',
		state.repository,
		'--base',
		state.branch,
		'--head',
		`${repository.split('/')[0]}:${branch}`,
		'--title',
		`vote: ${vote ? '+1' : '-1'} ${id}`,
		'--body',
		`Changes only ${state.login}'s vote for ${id}.`
	]);
	const url = output.match(
		/https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/\d+/
	)?.[0];
	if (!url) throw new Error('Vote commit created, but GitHub did not return a pull request URL.');
	return {
		action: 'opened',
		vote,
		url,
		message: `Opened ${vote ? 'upvote' : 'vote removal'} pull request.`,
		exitCode: 0
	};
};

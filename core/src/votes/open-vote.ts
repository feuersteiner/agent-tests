import { randomUUID } from 'node:crypto';
import { api } from './github.js';
import { updateScore } from './score.js';
import type { GhRunner, VoteResult, VoteState } from './types.js';

/** Find or create the voter's own fork when upstream write access is unavailable. */
const writableRepository = async (state: VoteState, gh: GhRunner): Promise<string> => {
	if (state.canPush) return state.repository;
	await gh(['repo', 'fork', state.repository, '--clone=false', '--default-branch-only']);
	const target = `${state.login}/${state.repository.split('/')[1]}`;
	const fork = await api<{ parent?: { full_name: string }; owner: { login: string } }>(
		gh,
		`repos/${target}`
	);
	if (
		fork.parent?.full_name.toLowerCase() !== state.repository.toLowerCase() ||
		fork.owner.login.toLowerCase() !== state.login.toLowerCase()
	)
		throw new Error('The target repository is not the authenticated user’s fork.');
	return target;
};

/** Create one branch and one CSV-only commit from the pinned main snapshot, then one PR. */
export const openVote = async (
	state: VoteState,
	id: string,
	vote: boolean,
	gh: GhRunner
): Promise<VoteResult> => {
	const repository = await writableRepository(state, gh);
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

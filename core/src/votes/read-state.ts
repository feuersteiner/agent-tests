import { api } from './github.js';
import { scoreRows } from './score.js';
import { requireRegularScore } from './read-mode.js';
import type { GhRunner, PendingVote, VoteState } from './types.js';

interface RepositoryData {
	default_branch: string;
	permissions?: { push?: boolean };
}

interface ContentFile {
	name: string;
	type: string;
}

/** Read the voter, immutable main snapshot, and their one pending vote without writes. */
export const readVoteState = async (
	repository: string,
	id: string,
	gh: GhRunner
): Promise<VoteState> => {
	const user = await api<{ login: string }>(gh, 'user');
	if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(user.login))
		throw new Error('GitHub returned an invalid account handle.');
	const details = await api<RepositoryData>(gh, `repos/${repository}`);
	const commit = await api<{ sha: string }>(
		gh,
		`repos/${repository}/commits/${encodeURIComponent(details.default_branch)}`
	);
	if (!/^[a-f0-9]{40}$/.test(commit.sha))
		throw new Error('GitHub returned an invalid main commit.');
	const directory = `repos/${repository}/contents/library/${id}`;
	const files = await api<ContentFile[]>(gh, `${directory}?ref=${commit.sha}`);
	if (
		!Array.isArray(files) ||
		!files.some((file) => file.name === 'test.yaml' && file.type === 'file')
	)
		throw new Error('The requested library test does not exist on main.');
	let score = 'github_handle\n';
	let scoreSha: string | undefined;
	if (files.some((file) => file.name === 'score.csv')) {
		await requireRegularScore(repository, id, commit.sha, gh);
		const content = await api<{ encoding: string; content: string; sha: string }>(
			gh,
			`${directory}/score.csv?ref=${commit.sha}`
		);
		if (content.encoding !== 'base64') throw new Error('Unsupported score.csv encoding.');
		score = Buffer.from(content.content, 'base64').toString('utf8');
		scoreSha = content.sha;
	}
	const rows = scoreRows(score);
	const output = await gh([
		'pr',
		'list',
		'--repo',
		repository,
		'--state',
		'open',
		'--author',
		user.login,
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
			pull.author.login.toLowerCase() === user.login.toLowerCase() &&
			[pull.title === `vote: +1 ${id}`, pull.title === `vote: -1 ${id}`].some(Boolean)
	);
	if (pending.length > 1)
		throw new Error('Multiple pending votes exist for this test; resolve them first.');
	return {
		repository,
		login: user.login,
		branch: details.default_branch,
		commit: commit.sha,
		canPush: details.permissions?.push === true,
		score,
		...(scoreSha ? { scoreSha } : {}),
		current: rows.some((row) => row.toLowerCase() === user.login.toLowerCase()),
		...(pending[0] ? { pending: pending[0] } : {})
	};
};

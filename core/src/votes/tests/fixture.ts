import type { GhRunner, PendingVote } from '../types.js';

export interface VoteFixtureOptions {
	login?: string;
	score?: string | null;
	canPush?: boolean;
	pending?: PendingVote[];
	missing?: boolean;
	forkParent?: string;
	scoreMode?: string;
	treeTruncated?: boolean;
}

/** Record mocked gh calls without creating votes, branches, forks or repository settings. */
export const voteFixture = (options: VoteFixtureOptions = {}) => {
	const calls: { args: string[]; body?: unknown }[] = [];
	const commit = 'a'.repeat(40);
	const score = options.score === undefined ? 'github_handle\nOther\n' : options.score;
	const gh: GhRunner = async (args, body) => {
		calls.push({ args, ...(body === undefined ? {} : { body }) });
		const [command, path] = args;
		if (command === 'pr' && path === 'list') return JSON.stringify(options.pending ?? []);
		if (command === 'pr' && path === 'create') return 'https://github.com/acme/tests/pull/7';
		if (command === 'pr' && path === 'close') return 'Closed';
		if (command === 'repo' && path === 'fork') return 'Fork ready';
		if (command !== 'api') throw new Error(`Unexpected mocked command: ${command}`);
		if (path === 'user') return JSON.stringify({ login: options.login ?? 'Voter' });
		if (path === 'repos/acme/tests')
			return JSON.stringify({
				default_branch: 'main',
				permissions: { push: options.canPush ?? true }
			});
		if (path === 'repos/acme/tests/commits/main') return JSON.stringify({ sha: commit });
		if (path === `repos/acme/tests/git/trees/${commit}?recursive=1`)
			return JSON.stringify({
				truncated: options.treeTruncated ?? false,
				tree: [
					{
						path: 'library/no-informal-english/score.csv',
						mode: options.scoreMode ?? '100644',
						type: 'blob'
					}
				]
			});
		if (path === 'repos/Voter/tests')
			return JSON.stringify({
				parent: { full_name: options.forkParent ?? 'acme/tests' },
				owner: { login: 'Voter' }
			});
		if (path?.endsWith(`/library/no-informal-english?ref=${commit}`))
			return JSON.stringify(
				options.missing
					? []
					: [
							{ name: 'TEST.md', type: 'file' },
							{ name: 'test.yaml', type: 'file' },
							...(score === null ? [] : [{ name: 'score.csv', type: 'file' }])
						]
			);
		if (path?.endsWith(`/score.csv?ref=${commit}`))
			return JSON.stringify({
				encoding: 'base64',
				content: Buffer.from(score ?? '').toString('base64'),
				sha: 'b'.repeat(40)
			});
		if (path?.endsWith('/git/refs') || path?.endsWith('/score.csv')) return '{}';
		throw new Error(`Unexpected mocked API: ${path}`);
	};
	return { gh, calls, commit };
};

export const pendingVote = (up = true): PendingVote => ({
	number: 7,
	title: `vote: ${up ? '+1' : '-1'} no-informal-english`,
	url: 'https://github.com/acme/tests/pull/7',
	author: { login: 'Voter' }
});

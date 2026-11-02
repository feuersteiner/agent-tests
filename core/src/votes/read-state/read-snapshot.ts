import { api } from '../utils.js';
import type { GhRunner } from '../types.js';
import type { RepositoryData, VoteSnapshot } from './types.js';

/**
 * Read and validate the login, default branch and immutable main commit.
 * @param repository Validated owner/repository.
 * @param gh Read-only GitHub transport.
 * @returns Voter and repository metadata pinned to one commit.
 * @throws Rejects malformed handles/commit SHAs and propagates transport failures.
 */
export const readSnapshot = async (repository: string, gh: GhRunner): Promise<VoteSnapshot> => {
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
	return {
		repository,
		login: user.login,
		branch: details.default_branch,
		commit: commit.sha,
		canPush: details.permissions?.push === true
	};
};

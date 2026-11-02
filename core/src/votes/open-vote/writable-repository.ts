import { api } from '../utils.js';
import type { GhRunner, VoteState } from '../types.js';

/**
 * Select upstream when writable, otherwise create/reuse and verify the voter's own fork.
 * @param state Validated voter and source repository metadata.
 * @param gh Injected transport; may create a fork.
 * @returns Writable upstream or authenticated-user fork repository.
 * @throws Rejects an unrelated owner/parent or propagates transport/parse failures.
 * A successfully created fork remains if a later validation or read fails.
 */
export const writableRepository = async (state: VoteState, gh: GhRunner): Promise<string> => {
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

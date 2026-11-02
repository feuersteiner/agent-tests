import { api } from '../utils.js';
import { readProtection } from '../read-protection.js';
import type { GhRunner } from '../types.js';
import type { SetupSnapshot } from './types.js';

/**
 * Read repository, protection, Actions permissions and labels in order.
 * @param repository Validated owner/repository.
 * @param gh Injected transport; all requests are read-only.
 * @returns Settings pinned to the default branch selected by the repository response.
 * @throws Propagates transport and malformed JSON failures; protection 404 means absent.
 */
export const readSettings = async (repository: string, gh: GhRunner): Promise<SetupSnapshot> => {
	const details = await api<{ default_branch: string; allow_auto_merge?: boolean }>(
		gh,
		`repos/${repository}`
	);
	const branch = details.default_branch;
	const protectionBefore = await readProtection(repository, branch, gh);
	const workflow = await api<SetupSnapshot['workflow']>(
		gh,
		`repos/${repository}/actions/permissions/workflow`
	);
	const labels = JSON.parse(
		await gh(['label', 'list', '--repo', repository, '--limit', '1000', '--json', 'name'])
	) as { name: string }[];
	return {
		branch,
		allowAutoMerge: !!details.allow_auto_merge,
		protectionBefore,
		workflow,
		labels
	};
};

import { api, hasStatus } from './utils.js';
import type { GhRunner } from './types.js';

/**
 * Read protection for a repository branch without mutation.
 * @param repository Validated owner/repository.
 * @param branch Branch name, encoded for the API path.
 * @param gh Injected GitHub transport.
 * @returns Current protection, or null for a 404 (unprotected branch).
 * @throws Propagates other transport or response parsing failures.
 */
export const readProtection = async (
	repository: string,
	branch: string,
	gh: GhRunner
): Promise<unknown> => {
	try {
		return await api(gh, `repos/${repository}/branches/${encodeURIComponent(branch)}/protection`);
	} catch (error) {
		if (hasStatus(error, 404)) return null;
		throw error;
	}
};

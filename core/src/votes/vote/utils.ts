import { runGh, validateTarget } from '../utils.js';
import type { VoteOptions } from '../types.js';

/**
 * Validate vote inputs and select the repository and transport before any remote call.
 * @param id Requested test ID.
 * @param options Optional repository, mutually exclusive directions and transport.
 * @returns Validated repository and selected transport.
 * @throws Rejects invalid repository/test IDs or simultaneous up/down options.
 */
export const prepareVote = (id: string, options: VoteOptions) => {
	const repository = options.repository ?? 'feuersteiner/agent-tests';
	validateTarget(repository, id);
	if (options.up && options.down) throw new Error('Choose only one of --up and --down.');
	return { repository, gh: options.gh ?? runGh };
};

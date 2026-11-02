import type { GhRunner, SetupChange } from '../types.js';

/**
 * Perform planned operations serially, stopping at the first failed transport call.
 * @param changes Ordered request arguments, JSON payloads and descriptions.
 * @param gh Mutation-capable injected transport.
 * @returns Completed descriptions only when every operation succeeds.
 * @throws Propagates a failed write; prior writes remain applied without rollback.
 */
export const applyChanges = async (changes: SetupChange[], gh: GhRunner): Promise<string[]> => {
	const completed: string[] = [];
	for (const change of changes) {
		await gh(change.args, change.body);
		completed.push(change.description);
	}
	return completed;
};

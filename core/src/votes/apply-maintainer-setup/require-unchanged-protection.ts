import { protectionFingerprint } from '../utils.js';
import { readProtection } from '../read-protection.js';
import type { GhRunner, MaintainerPlan } from '../types.js';

/**
 * Compare current protection against the planned snapshot before any settings writes.
 * @param plan Repository, branch and previous protection snapshot.
 * @param gh Read-only GitHub transport.
 * @throws Rejects changed protection or propagates read/parse failures.
 */
export const requireUnchangedProtection = async (
	plan: MaintainerPlan,
	gh: GhRunner
): Promise<void> => {
	const current = await readProtection(plan.repository, plan.branch, gh);
	if (protectionFingerprint(current) !== protectionFingerprint(plan.protectionBefore))
		throw new Error('Branch protection changed after planning; inspect a fresh maintainer plan.');
};

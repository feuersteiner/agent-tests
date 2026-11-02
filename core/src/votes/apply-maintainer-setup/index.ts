import { runGh, validateTarget } from '../utils.js';
import { requireUnchangedProtection } from './require-unchanged-protection.js';
import { applyChanges } from './apply-changes.js';
import type { GhRunner, MaintainerPlan } from '../types.js';

/**
 * Apply an explicitly requested plan after checking for concurrent protection edits.
 * @param plan Previously inspected repository plan.
 * @param gh GitHub transport, defaulting to the noninteractive CLI.
 * @returns Descriptions of all completed operations, in plan order.
 * @throws Rejects invalid targets or changed protection before writes. A later write
 * failure stops application; earlier successful writes remain and are not rolled back.
 */
export const applyMaintainerSetup = async (
	plan: MaintainerPlan,
	gh: GhRunner = runGh
): Promise<string[]> => {
	validateTarget(plan.repository);
	await requireUnchangedProtection(plan, gh);
	return applyChanges(plan.changes, gh);
};

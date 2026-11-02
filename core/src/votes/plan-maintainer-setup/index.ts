import { runGh, validateTarget } from '../utils.js';
import { readSettings } from './read-settings.js';
import { buildPlan } from './build-plan.js';
import type { GhRunner, MaintainerPlan } from '../types.js';

/**
 * Inspect settings and prepare an explicit maintainer plan without changing GitHub.
 * @param repository Owner/repository; defaults to feuersteiner/agent-tests.
 * @param gh GitHub transport, defaulting to the noninteractive CLI.
 * @returns Ordered changes preserving existing protection and workflow token permissions.
 * @throws Rejects invalid targets, unavailable access and invalid read responses.
 */
export const planMaintainerSetup = async (
	repository = 'feuersteiner/agent-tests',
	gh: GhRunner = runGh
): Promise<MaintainerPlan> => {
	validateTarget(repository);
	const snapshot = await readSettings(repository, gh);
	return buildPlan(repository, snapshot);
};

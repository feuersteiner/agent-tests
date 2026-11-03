import type { DecisionModel } from '../models/index.js';
import type { TestDefinition } from '../schema/index.js';
import { evaluateTriggers } from './evaluate-triggers/index.js';
import type { TargetSelection, TriggerTarget } from './types.js';

/**
 * Select owner-relative candidate files without executing checks or accessing the filesystem.
 * @param definition Test whose ordered triggers select candidates.
 * @param candidates Owner-relative POSIX paths and file text supplied by discovery or evals.
 * @param model Optional decision provider for ask filters.
 * @returns Selected candidates, unresolved candidates, and deduplicated warnings.
 * Deterministically rejected candidates are omitted from both lists.
 * @throws If a content regex is invalid or a model request fails.
 */
export const selectTargets = async (
	definition: TestDefinition,
	candidates: TriggerTarget[],
	model?: DecisionModel
): Promise<TargetSelection> => {
	const selection: TargetSelection = { targets: [], skipped: [], warnings: [] };
	for (const candidate of candidates) {
		const result = await evaluateTriggers(definition.triggers, candidate, model);
		if (result.matched) selection.targets.push(candidate);
		if (result.skipped) selection.skipped.push(candidate);
		selection.warnings.push(...result.warnings);
	}
	selection.warnings = [...new Set(selection.warnings)];
	return selection;
};

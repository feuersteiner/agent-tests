import type { DecisionModel } from '../models/index.js';
import type { TestDefinition } from '../schema/index.js';
import { evaluateTriggers } from './evaluate-triggers.js';
import type { TargetSelection, TriggerTarget } from './types.js';

/** Select owner-relative candidate files without executing checks or changing the repository. */
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

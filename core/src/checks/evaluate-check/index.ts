import type { CheckDefinition, TestDefinition } from '../../schema/index.js';
import type { DecisionModel } from '../../models/index.js';
import type { CheckEvaluation, CheckTarget } from '../types.js';
import { evaluateFast } from '../fast/index.js';
import { completeFast } from './complete-fast.js';
import { evaluateModel } from './evaluate-model.js';
import { unavailable } from './unavailable.js';

/** Evaluate a check through fast, smart and deep; invalid patterns or model failures reject. */
export const evaluateCheck = async (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	model?: DecisionModel
): Promise<CheckEvaluation> => {
	const fast = evaluateFast(check.fast, target.content);
	if (fast.matches.length || (!check.smart && !check.deep))
		return completeFast(definition, check, target, fast.matches, fast.hints);

	if (!model) return unavailable(definition, check, target);
	return evaluateModel(definition, check, target, model, fast.hints);
};

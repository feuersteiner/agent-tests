import type { DecisionModel } from '../models/index.js';
import type { Trigger } from '../schema/index.js';
import { evaluateFilter } from './evaluate-filter.js';
import type { TriggerResult, TriggerTarget } from './types.js';

/** Evaluate one conjunction in written path/content order without reading or writing files. */
const evaluateAlternative = async (
	trigger: Trigger,
	target: TriggerTarget,
	model?: DecisionModel
): Promise<TriggerResult> => {
	for (const kind of Object.keys(trigger) as (keyof Trigger)[]) {
		const filter = trigger[kind];
		if (filter === undefined) continue;
		const result = await evaluateFilter(kind, filter, target, model);
		if (!result.matched) return result;
	}
	return { matched: true, skipped: false, warnings: [] };
};

/**
 * Select a file when the first passing alternative accepts all its filters.
 * Missing or unsure model decisions skip unresolved alternatives. Model failures throw.
 */
export const evaluateTriggers = async (
	triggers: Trigger | Trigger[],
	target: TriggerTarget,
	model?: DecisionModel
): Promise<TriggerResult> => {
	const alternatives = Array.isArray(triggers) ? triggers : [triggers];
	const warnings: string[] = [];
	let skipped = false;
	for (const trigger of alternatives) {
		const result = await evaluateAlternative(trigger, target, model);
		if (result.matched) return result;
		skipped ||= result.skipped;
		warnings.push(...result.warnings);
	}
	return { matched: false, skipped, warnings: [...new Set(warnings)] };
};

import type { DecisionModel } from '../../models/index.js';
import type { Trigger } from '../../schema/index.js';
import { evaluateFilter } from '../evaluate-filter.js';
import type { TriggerResult, TriggerTarget } from '../types.js';

/**
 * Evaluate one alternative in written path/content order, stopping on its first rejection.
 * @param trigger Conjunctive path/content filters in their authored order.
 * @param target Owner-relative POSIX path and file text supplied by the caller.
 * @param model Optional decision provider for ask filters.
 * @returns Acceptance, rejection, or an unresolved decision with warnings.
 * @throws If a content regex is invalid or a model request fails.
 */
export const evaluateAlternative = async (
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

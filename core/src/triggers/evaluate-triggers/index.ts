import type { DecisionModel } from '../../models/index.js';
import type { Trigger } from '../../schema/index.js';
import { evaluateAlternative } from './evaluate-alternative.js';
import type { TriggerResult, TriggerTarget } from '../types.js';

/**
 * Select a file when the first passing alternative accepts all its filters.
 * @param triggers One conjunctive trigger or ordered alternatives; the first match wins.
 * @param target Owner-relative POSIX path and file text; no filesystem access occurs.
 * @param model Optional decision provider for ask filters.
 * @returns The first accepted result, or rejected/unresolved status and deduplicated warnings.
 * @throws If a content regex is invalid or a model request fails.
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

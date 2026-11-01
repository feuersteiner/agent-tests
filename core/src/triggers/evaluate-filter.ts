import type { DecisionModel } from '../models/index.js';
import type { TriggerFilter } from '../schema/index.js';
import { matchFilter } from './match-filter.js';
import type { TriggerResult, TriggerTarget } from './types.js';

/** Evaluate one path or content filter, preserving the order of match and ask. */
export const evaluateFilter = async (
	kind: 'path' | 'content',
	filter: TriggerFilter,
	target: TriggerTarget,
	model?: DecisionModel
): Promise<TriggerResult> => {
	for (const key of Object.keys(filter) as (keyof TriggerFilter)[]) {
		if (key === 'match' && filter.match !== undefined)
			if (!matchFilter(target[kind], filter.match, kind))
				return { matched: false, skipped: false, warnings: [] };

		if (key === 'ask' && filter.ask !== undefined) {
			if (!model)
				return {
					matched: false,
					skipped: true,
					warnings: [`Skipped trigger for ${target.path}: ${kind}.ask requires a model.`]
				};

			let response;
			try {
				response = await model.decide({
					ask: filter.ask,
					path: target.path,
					...(kind === 'content' ? { content: target.content } : {}),
					level: 'trigger'
				});
			} catch {
				throw new Error('Trigger model request failed');
			}
			if (response.decision !== 'pass')
				return {
					matched: false,
					skipped: response.decision === 'unsure',
					warnings:
						response.decision === 'unsure'
							? [`Skipped trigger for ${target.path}: ${kind}.ask was unsure.`]
							: []
				};
		}
	}
	return { matched: true, skipped: false, warnings: [] };
};

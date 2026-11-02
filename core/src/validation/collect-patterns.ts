import type { TestDefinition } from '../schema/index.js';
import type { Pattern } from './types.js';
import { listPatterns } from './utils.js';

/** Collects trigger and fast-check patterns with their owning check ids. */
export const collectPatterns = (definition: TestDefinition): Pattern[] => {
	const triggers = Array.isArray(definition.triggers) ? definition.triggers : [definition.triggers];
	return [
		...triggers.flatMap((trigger) =>
			listPatterns(trigger.content?.match).map((value) => ({ value }))
		),
		...definition.checks.flatMap((check) =>
			[...listPatterns(check.fast?.match), ...listPatterns(check.fast?.maybe)].map((value) => ({
				value,
				checkId: check.id
			}))
		)
	];
};

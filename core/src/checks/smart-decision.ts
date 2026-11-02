import type { CheckDefinition } from '../schema/index.js';
import type { DecisionResponse } from '../models/index.js';

/** Interpret smart confidence as confidence that the file contains a violation. */
export const smartDecision = (check: CheckDefinition, response: DecisionResponse) => {
	if (response.decision === 'unsure' || response.confidence === undefined) return response.decision;
	const [lower, upper] = check.smart?.bounds ?? [0.3, 0.8];
	if (response.confidence < lower) return 'pass';
	if (response.confidence > upper) return 'fail';
	return 'unsure';
};

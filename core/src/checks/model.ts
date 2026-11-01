import type { CheckDefinition } from '../schema/index.js';
import type { DecisionModel, DecisionResponse } from '../models/index.js';
import type { CheckTarget } from './types.js';

/** Ask a configured check level and sanitize provider failures before propagation. */
export const askModel = async (
	model: DecisionModel,
	check: CheckDefinition,
	target: CheckTarget,
	level: 'smart' | 'deep',
	hints: string[]
): Promise<DecisionResponse> => {
	const stage = check[level];
	if (!stage) throw new Error('Missing model check configuration.');
	try {
		const response = await model.decide({
			ask: stage.ask,
			path: target.path,
			content: target.content,
			level,
			hints,
			...(level === 'deep' && check.deep?.reasoning ? { reasoning: check.deep.reasoning } : {})
		});
		if (!['pass', 'fail', 'unsure'].includes(response.decision))
			throw new Error('Invalid decision.');

		if (
			response.confidence !== undefined &&
			(!Number.isFinite(response.confidence) || response.confidence < 0 || response.confidence > 1)
		)
			throw new Error('Invalid confidence.');

		return response;
	} catch {
		throw new Error(`Model evaluation failed for check ${check.id} at ${level}.`);
	}
};

/** Interpret smart confidence as confidence that the file contains a violation. */
export const smartDecision = (check: CheckDefinition, response: DecisionResponse) => {
	if (response.decision === 'unsure' || response.confidence === undefined) return response.decision;
	const [lower, upper] = check.smart?.bounds ?? [0.3, 0.8];
	if (response.confidence < lower) return 'pass';
	if (response.confidence > upper) return 'fail';
	return 'unsure';
};

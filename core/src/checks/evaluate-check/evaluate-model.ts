import type { CheckDefinition, TestDefinition } from '../../schema/index.js';
import type { CheckEvaluation, CheckTarget, PatternMatch } from '../types.js';
import { emptyEvaluation } from './utils.js';
import type { DecisionModel, DecisionResponse } from '../../models/index.js';
import { askModel } from '../ask-model.js';
import { smartDecision } from '../smart-decision.js';
import { completeModel } from './complete-model.js';

/** Run configured model levels, forwarding hints; sanitized provider failures reject evaluation. */
export const evaluateModel = async (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	model: DecisionModel,
	fastHints: PatternMatch[]
): Promise<CheckEvaluation> => {
	const hints = fastHints.map((match) => match.text);
	let response: DecisionResponse | undefined;
	if (check.smart) {
		response = await askModel(model, check, target, 'smart', hints);
		response = { ...response, decision: smartDecision(check, response) };
		if (response.decision === 'pass' || !check.deep)
			return completeModel(definition, check, target, 'smart', response);

		hints.push(...(response.matches?.map((match) => match.text) ?? []));
	}
	if (check.deep) {
		response = await askModel(model, check, target, 'deep', hints);
		return completeModel(definition, check, target, 'deep', response);
	}
	return emptyEvaluation('pass');
};

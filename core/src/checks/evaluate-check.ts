import type { CheckDefinition, TestDefinition } from '../schema/index.js';
import type { DecisionModel, DecisionResponse } from '../models/index.js';
import type { FindingLevel } from '../results/index.js';
import type { CheckEvaluation, CheckTarget } from './types.js';
import { evaluateFast } from './fast.js';
import { createFindings } from './findings.js';
import { askModel, smartDecision } from './model.js';

const empty = (outcome: CheckEvaluation['outcome']): CheckEvaluation => ({
	outcome,
	findings: [],
	warnings: [],
	skipped: [],
	checked: outcome === 'skip' ? 0 : 1
});

const unavailable = (definition: TestDefinition, check: CheckDefinition, target: CheckTarget) => {
	const reason = `Model unavailable; ${definition.id}/${check.id} requires model evaluation.`;
	return {
		...empty('skip'),
		warnings: [reason],
		skipped: [{ testId: definition.id, file: target.path, reason }]
	};
};

const complete = (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	level: FindingLevel,
	response: DecisionResponse
): CheckEvaluation => ({
	...empty(response.decision),
	findings:
		response.decision === 'pass'
			? []
			: createFindings(
					definition,
					check,
					target,
					level,
					response.decision === 'fail' ? 'error' : 'warning',
					[],
					response
				)
});

/** Evaluate one check through fast, smart, then deep; missing credentials skip unresolved work. */
export const evaluateCheck = async (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	model?: DecisionModel
): Promise<CheckEvaluation> => {
	const fast = evaluateFast(check.fast, target.content);
	if (fast.matches.length)
		return {
			...empty('fail'),
			findings: createFindings(definition, check, target, 'fast', 'error', fast.matches)
		};

	const hints = fast.hints.map((match) => match.text);
	if (!check.smart && !check.deep) {
		if (!hints.length) return empty('pass');
		return complete(definition, check, target, 'fast', {
			decision: 'unsure',
			matches: fast.hints.map((match) => ({ text: match.text }))
		});
	}
	if (!model) return unavailable(definition, check, target);
	let response: DecisionResponse | undefined;
	if (check.smart) {
		response = await askModel(model, check, target, 'smart', hints);
		response = { ...response, decision: smartDecision(check, response) };
		if (response.decision === 'pass' || !check.deep)
			return complete(definition, check, target, 'smart', response);

		hints.push(...(response.matches?.map((match) => match.text) ?? []));
	}
	if (check.deep) {
		response = await askModel(model, check, target, 'deep', hints);
		return complete(definition, check, target, 'deep', response);
	}
	return empty('pass');
};

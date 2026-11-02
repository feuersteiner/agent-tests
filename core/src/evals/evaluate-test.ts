import type { DecisionModel } from '../models/index.js';
import type { TestDefinition } from '../schema/index.js';
import { evaluateCase } from './case.js';
import { withFixtureRepository } from './fixture.js';
import type { EvalCaseResult, EvalResult } from './types.js';

/** Executes labeled examples in a temporary Git repository and reports every disagreement. */
export const evaluateTest = async (
	definition: TestDefinition,
	model?: DecisionModel
): Promise<EvalResult> => {
	if (definition.evals.length === 0) throw new Error('A test needs at least one eval example.');
	const cases: EvalCaseResult[] = [];
	for (const example of definition.evals)
		cases.push(
			await withFixtureRepository((directory) =>
				evaluateCase(directory, definition, example, model)
			)
		);

	const failed = cases.filter((example) => !example.passed).length;
	return {
		testId: definition.id,
		cases,
		passed: cases.length - failed,
		failed,
		skipped: cases.filter((example) => example.actual === 'skip').length,
		exitCode: cases.some((example) => example.actual === 'error') ? 2 : failed > 0 ? 1 : 0
	};
};

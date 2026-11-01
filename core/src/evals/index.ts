import { discoverTests } from '../discovery/index.js';
import type { DecisionModel } from '../models/index.js';
import type { TestDefinition } from '../schema/index.js';
import { evaluateCase } from './case.js';
import { withFixtureRepository } from './fixture.js';
import type { EvalCaseResult, EvalResult } from './types.js';

export type { EvalCaseResult, EvalResult } from './types.js';
export { isSafeEvalPath } from './path.js';

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

/** Runs installed tests' examples, or throws when a requested id is not installed. */
export const evaluateTests = async (
	root: string,
	id?: string,
	model?: DecisionModel
): Promise<EvalResult[]> => {
	const tests = (await discoverTests(root)).filter((test) => id === undefined || test.id === id);
	if (id !== undefined && tests.length === 0) throw new Error(`Test '${id}' is not installed.`);
	const results: EvalResult[] = [];
	for (const test of tests) results.push(await evaluateTest(test.definition, model));
	return results;
};

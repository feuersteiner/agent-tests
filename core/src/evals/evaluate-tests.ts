import { discoverTests } from '../discovery/index.js';
import type { DecisionModel } from '../models/index.js';
import { evaluateTest } from './evaluate-test.js';
import type { EvalResult } from './types.js';

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

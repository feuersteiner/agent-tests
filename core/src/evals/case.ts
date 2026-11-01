import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { evaluateChecks } from '../checks/index.js';
import type { DecisionModel } from '../models/index.js';
import type { EvalDefinition, TestDefinition } from '../schema/index.js';
import { evaluateTriggers } from '../triggers/index.js';
import { isSafeEvalPath } from './path.js';
import type { EvalCaseResult } from './types.js';

/** Materializes one example and executes the production trigger and check stages. */
export const evaluateCase = async (
	directory: string,
	definition: TestDefinition,
	example: EvalDefinition,
	model?: DecisionModel
): Promise<EvalCaseResult> => {
	const base = { name: example.name, path: example.path, expected: example.expect };
	if (!isSafeEvalPath(example.path))
		return {
			...base,
			actual: 'error',
			passed: false,
			findings: [],
			warnings: [],
			error: 'Unsafe eval path.'
		};

	try {
		const file = join(directory, example.path);
		await mkdir(dirname(file), { recursive: true });
		await writeFile(file, example.content);
		const target = { path: example.path, content: await readFile(file, 'utf8') };
		const trigger = await evaluateTriggers(definition.triggers, target, model);
		if (!trigger.matched)
			return {
				...base,
				actual: 'skip',
				passed: !trigger.skipped && example.expect === 'skip',
				findings: [],
				warnings: trigger.warnings,
				unrun: trigger.skipped
			};

		const evaluation = await evaluateChecks(definition, target, model);
		return {
			...base,
			actual: evaluation.outcome,
			passed: evaluation.skipped.length === 0 && example.expect === evaluation.outcome,
			findings: evaluation.findings,
			warnings: [...trigger.warnings, ...evaluation.warnings],
			unrun: evaluation.skipped.length > 0
		};
	} catch {
		return {
			...base,
			actual: 'error',
			passed: false,
			findings: [],
			warnings: [],
			error: 'The eval could not complete; check its paths, patterns and model configuration.'
		};
	}
};

import { relative, resolve } from 'node:path';
import { createConfiguredModel, loadConfiguration } from '../configuration/index.js';
import { collectCandidates, discoverTests, testsForFile } from '../discovery/index.js';
import type { RunScope } from '../discovery/index.js';
import type { DecisionModel } from '../models/index.js';
import { createRunResult } from '../results/index.js';
import type { RunResult } from '../results/index.js';
import { evaluateTriggers } from '../triggers/index.js';
import { evaluateChecks } from './evaluate-checks.js';

/** Discover scoped tests and targets, then return findings; runtime failures exit with code two. */
export const runTests = async (
	root: string,
	scope: RunScope = {},
	model?: DecisionModel
): Promise<RunResult> => {
	const result = createRunResult();
	try {
		const directory = resolve(root);
		const configured = model ?? createConfiguredModel(await loadConfiguration(directory));
		const definitions = await discoverTests(directory);
		const candidates = await collectCandidates(directory, scope);
		for (const target of candidates)
			for (const test of testsForFile(definitions, target)) {
				const path = relative(resolve(directory, test.owner), target.absolutePath)
					.split('\\')
					.join('/');
				const trigger = await evaluateTriggers(
					test.definition.triggers,
					{ path, content: target.content },
					configured
				);
				result.warnings.push(...trigger.warnings);
				if (!trigger.matched) {
					if (trigger.skipped)
						result.skipped.push({
							testId: test.id,
							file: target.path,
							reason: 'Trigger needs an available model decision.'
						});
					continue;
				}
				const evaluated = await evaluateChecks(test.definition, target, configured);
				result.findings.push(...evaluated.findings);
				result.warnings.push(...evaluated.warnings);
				result.skipped.push(...evaluated.skipped);
				result.checked += evaluated.checked;
			}

		result.warnings = [...new Set(result.warnings)];
		return createRunResult(result);
	} catch {
		result.warnings.push(
			'Unable to run agent tests: configuration, discovery or evaluation failed.'
		);
		return createRunResult(result, true);
	}
};

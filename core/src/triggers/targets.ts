import { realpath } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { createConfiguredModel, loadConfiguration } from '../configuration/index.js';
import { collectCandidates, discoverTests, testsForFile } from '../discovery/index.js';
import type { RunScope } from '../discovery/index.js';
import type { DecisionModel } from '../models/index.js';
import { evaluateTriggers } from './evaluate-triggers/index.js';
import type { TargetFilesResult } from './types.js';

/**
 * Select one installed test's files without executing checks or modifying the repository.
 * @param root Repository directory; symlinks resolve to its canonical filesystem location.
 * @param id Bare test ID when unique, or owner/id (./id for a root-owned test).
 * @param scope Candidate path and Git filters; the default considers all discoverable files.
 * @param model Optional decision provider; otherwise repository model configuration is used.
 * @returns Repository-relative selected and unresolved paths, warnings, and exit code 0.
 * Deterministic rejections are omitted; missing/unsure model decisions are unresolved.
 * @throws If the root cannot be resolved, the ID is unknown/ambiguous, discovery/configuration
 * fails, a content regex is invalid, or a model request fails.
 */
export const targetFiles = async (
	root: string,
	id: string,
	scope: RunScope = {},
	model?: DecisionModel
): Promise<TargetFilesResult> => {
	const directory = await realpath(resolve(root));
	const tests = await discoverTests(directory);
	const matching = tests.filter((test) => test.id === id || `${test.owner}/${test.id}` === id);
	if (matching.length !== 1)
		throw new Error(
			matching.length ? `Ambiguous test: ${id}; use owner/id` : `Unknown test: ${id}`
		);
	const test = matching[0]!;
	const configured = model ?? createConfiguredModel(await loadConfiguration(directory));
	const result: TargetFilesResult = {
		testId: test.id,
		files: [],
		skipped: [],
		warnings: [],
		exitCode: 0
	};
	for (const candidate of await collectCandidates(directory, scope)) {
		if (!testsForFile(tests, candidate).includes(test)) continue;
		const path = relative(resolve(directory, test.owner), candidate.absolutePath)
			.split(sep)
			.join('/');
		const trigger = await evaluateTriggers(
			test.definition.triggers,
			{ path, content: candidate.content },
			configured
		);
		if (trigger.matched) result.files.push(candidate.path);
		else if (trigger.skipped) result.skipped.push(candidate.path);
		result.warnings.push(...trigger.warnings);
	}
	result.warnings = [...new Set(result.warnings)];
	return result;
};

import {
	createConfiguredModel,
	evaluateTests,
	formatGitHubAnnotations,
	formatJson,
	formatText,
	loadConfiguration,
	runTests,
	validateTests
} from 'agent-tests';
import { present } from './present.js';
import { scopeFor } from './scope.js';
import type { CommandOutput, ParsedCommand } from './types.js';
import { combineExitCodes, formatEvals } from './utils.js';

/** Execute run, static validation or labeled evaluations without duplicating engine logic. */
export const evaluationCommand = async (
	root: string,
	command: ParsedCommand
): Promise<CommandOutput> => {
	const json = Boolean(command.options.json);
	if (command.command === 'run') {
		const result = await runTests(root, scopeFor(command));
		const annotations =
			process.env.GITHUB_ACTIONS === 'true' ? formatGitHubAnnotations(result.findings) : '';
		return {
			stdout: json ? formatJson(result) : formatText(result),
			...(annotations ? { stderr: annotations } : {}),
			exitCode: result.exitCode
		};
	}
	if (command.command === 'validate') {
		const results = await validateTests(root, command.args[0]);
		const exitCode = combineExitCodes(results);
		const text = results
			.map((result) =>
				[
					`${result.testId ?? result.directory}: ${result.valid ? 'valid' : 'invalid'}`,
					...result.issues.map((issue) => `  ${issue.severity}: ${issue.code}: ${issue.message}`)
				].join('\n')
			)
			.join('\n');
		return present(json, { results, exitCode }, text || 'No tests to validate.', exitCode);
	}
	const model = createConfiguredModel(await loadConfiguration(root));
	const results = await evaluateTests(root, command.args[0], model);
	const exitCode = combineExitCodes(results);
	return present(json, { results, exitCode }, formatEvals(results) || 'No evals to run.', exitCode);
};

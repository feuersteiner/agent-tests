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
import type { EvalResult } from 'agent-tests';
import { combineExitCodes, present, warningsText } from './present.js';
import { scopeFor } from './scope.js';
import type { CommandOutput, ParsedCommand } from './types.js';

/** Explain each labeled example, distinguishing skipped work from matched expectations. */
export const formatEvals = (results: EvalResult[]): string =>
	results
		.map((result) =>
			[
				`${result.testId}: ${result.passed} matched expectations, ${result.failed} disagreements, ${result.skipped} skipped outcomes`,
				...result.cases.flatMap((example) => [
					`  ${example.unrun ? 'unrun' : example.passed ? 'match' : 'disagreement'}: ${example.name} (${example.path}); expected ${example.expected}, got ${example.actual}`,
					...(example.error ? [`  error: ${example.error}`] : []),
					...warningsText(example.warnings)
				])
			].join('\n')
		)
		.join('\n');

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

import { compileTest, initializeProject, loadConfiguration, voteTest } from 'agent-tests';
import { present } from './present.js';
import type { CommandOutput, ParsedCommand } from './types.js';
import { warningsText } from './utils.js';

/** Dispatch configuration writes, compilation briefs and the authenticated user's vote. */
export const workspaceCommand = async (
	root: string,
	command: ParsedCommand
): Promise<CommandOutput> => {
	const json = Boolean(command.options.json);
	if (command.command === 'compile') {
		const brief = await compileTest(root, command.args[0]!);
		return present(json, { id: command.args[0], brief, exitCode: 0 }, brief);
	}
	if (command.command === 'init') {
		const result = await initializeProject(root, {
			hook: Boolean(command.options.hook),
			vitest: Boolean(command.options.vitest),
			github: Boolean(command.options.github)
		});
		const text = [
			...result.created.map((file) => `created: ${file}`),
			...result.skipped.map((file) => `kept: ${file}`),
			...warningsText(result.warnings)
		].join('\n');
		return present(json, result, text || 'Project already initialized.', result.exitCode);
	}
	const loaded = await loadConfiguration(root);
	const result = await voteTest(command.args[0]!, {
		repository: loaded.config.library?.repository,
		up: Boolean(command.options.up),
		down: Boolean(command.options.down)
	});
	return present(
		json,
		result,
		[result.message, ...(result.url ? [result.url] : [])].join('\n'),
		result.exitCode
	);
};

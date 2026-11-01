import { createRunResult, formatJson, formatText } from 'agent-tests';
import { help } from './help.js';
import type { CommandOutput, ParsedCommand } from './types.js';

/** Call public library features and return presentation; stubs fail with exit 2. */
export const execute = async (command: ParsedCommand): Promise<CommandOutput> => {
	if (command.command === 'help') return { stdout: help(), exitCode: 0 };
	if (command.command === 'version') return { stdout: '0.0.1', exitCode: 0 };
	const result = createRunResult(
		{ warnings: [`Command "${command.command}" is not implemented yet.`] },
		true
	);
	return {
		stdout: command.options.json ? formatJson(result) : formatText(result),
		exitCode: result.exitCode
	};
};

import { evaluationCommand } from './evaluation-command.js';
import { help } from './help.js';
import { libraryCommand } from './library-command.js';
import { queryCommand } from './query-command.js';
import { workspaceCommand } from './workspace-command.js';
import type { CommandOutput, ParsedCommand } from './types.js';

/** Dispatch one parsed command to a thin presentation stage over the public library. */
export const execute = async (command: ParsedCommand): Promise<CommandOutput> => {
	if (command.command === 'help') return { stdout: help(), exitCode: 0 };
	if (command.command === 'version') return { stdout: '0.0.1', exitCode: 0 };
	const root = process.cwd();
	if (['list', 'targets', 'docs'].includes(command.command)) return queryCommand(root, command);
	if (['run', 'validate', 'eval'].includes(command.command))
		return evaluationCommand(root, command);
	if (['add', 'update', 'remove'].includes(command.command)) return libraryCommand(root, command);
	return workspaceCommand(root, command);
};

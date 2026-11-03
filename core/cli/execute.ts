import { help } from './help.js';
import type { CommandOutput, ParsedCommand } from './types.js';

/** Dispatch help and version while command stages are introduced. */
export const execute = async (command: ParsedCommand): Promise<CommandOutput> => {
	if (command.command === 'help') return { stdout: help(), exitCode: 0 };
	if (command.command === 'version') return { stdout: '0.0.1', exitCode: 0 };
	return { stderr: 'Command is not implemented yet.', exitCode: 2 };
};

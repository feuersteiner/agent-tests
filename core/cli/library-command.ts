import { addTest, removeTest, updateTests } from 'agent-tests';
import { formatEvals } from './evaluation-command.js';
import { combineExitCodes, present, warningsText } from './present.js';
import type { CommandOutput, ParsedCommand } from './types.js';

/** Install, update or remove managed copies using the library's provenance safeguards. */
export const libraryCommand = async (
	root: string,
	command: ParsedCommand
): Promise<CommandOutput> => {
	const results =
		command.command === 'update'
			? await updateTests(root, command.args[0])
			: [
					command.command === 'add'
						? await addTest(root, command.args[0]!, command.args[1])
						: await removeTest(root, command.args[0]!, command.args[1])
				];
	const exitCode = combineExitCodes(results);
	const text = results
		.map((result) =>
			[
				`${result.id}: ${result.status}${result.commit ? ` (${result.commit})` : ''}`,
				...warningsText(result.warnings),
				...(result.brief ? [result.brief] : []),
				...(result.evals ? [formatEvals([result.evals])] : [])
			].join('\n')
		)
		.join('\n');
	return present(
		Boolean(command.options.json),
		{ results, exitCode },
		text || 'No installed tests to update.',
		exitCode
	);
};

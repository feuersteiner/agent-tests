import { createRunResult, formatJson, formatText } from 'agent-tests';
import { execute } from './execute.js';
import { parse } from './parse.js';
import type { CommandOutput } from './types.js';

/** Parse and execute one invocation; turn usage/runtime failures into exit 2. */
export const runCommand = async (argv: string[]): Promise<CommandOutput> => {
	try {
		return await execute(parse(argv));
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Command failed';
		const result = createRunResult({ warnings: [message] }, true);
		return {
			stderr: argv.includes('--json') ? formatJson(result) : formatText(result),
			exitCode: result.exitCode
		};
	}
};

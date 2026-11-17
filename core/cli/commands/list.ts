import { command, type Command } from 'clinguini';
import { basename, dirname } from 'node:path';
import { loadTestFiles } from '../../src/loader/index.ts';
import type { AgentTestFile } from '../../src/loader/types.ts';
import { message } from '../helpers/error.ts';

/** `<id>  <title>` for a valid Test; `<folder>  invalid; run ...` for one that did not load. */
const toLine = ({ path, test }: AgentTestFile): string => {
	if (test) return `${test.id}  ${test.title}`;
	const folder = basename(dirname(path));
	return `${folder}  invalid; run \`agentests validate ${folder}\``;
};

export const listCommand: Command = command({
	name: 'list',
	description: 'List installed tests.',
	handler: (): void => {
		try {
			for (const file of loadTestFiles()) console.log(toLine(file));
			process.exitCode = 0;
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

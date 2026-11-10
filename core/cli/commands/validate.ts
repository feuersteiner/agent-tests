import { command, type Command } from 'clinguini';
import { loadRunner } from '../config/index.ts';

export const validateCommand: Command = command({
	name: 'validate',
	description: 'Validate test definitions.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: ({ params }): void => {
		const runner = loadRunner(params.id);
		console.log(`Loaded config and ${runner.tests.length} agent test(s).`);
		console.log('Configuration and test definitions are valid.');
	}
});

import { command, type Command } from 'clinguini';
import { loadRunner } from '../config/index.ts';

export const compileCommand: Command = command({
	name: 'compile',
	description: 'Compile a test rule into a test definition.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: ({ params }): void => {
		const runner = loadRunner(params.id);
		console.log(`Loaded config and ${runner.tests.length} agent test(s).`);
		console.log(`compile ${params.id}: loaded successfully; action is scaffolded.`);
	}
});

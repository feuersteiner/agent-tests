import { command, type Command } from 'clinguini';

export const compileCommand: Command = command({
	name: 'compile',
	description: 'Compile a test rule into a test definition.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: (): void => {
		console.log('compile: not implemented yet.');
	}
});

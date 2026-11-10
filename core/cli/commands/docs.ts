import { command, type Command } from 'clinguini';

export const docsCommand: Command = command({
	name: 'docs',
	description: 'Show skills for writing and running tests.',
	handler: (): void => {
		console.log('docs: scaffold only.');
	}
});

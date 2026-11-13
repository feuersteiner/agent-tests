import { command, type Command } from 'clinguini';

export const listCommand: Command = command({
	name: 'list',
	description: 'List installed tests.',
	handler: (): void => {
		console.log('list: not implemented yet.');
	}
});

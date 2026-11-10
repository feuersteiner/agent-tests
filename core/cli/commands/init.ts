import { command, type Command } from 'clinguini';

export const initCommand: Command = command({
	name: 'init',
	description: 'Initialize repository test configuration and setup.',
	handler: (): void => {
		console.log('init: scaffold only.');
	}
});

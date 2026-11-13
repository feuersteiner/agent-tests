import { command, type Command } from 'clinguini';

export const validateCommand: Command = command({
	name: 'validate',
	description: 'Validate test definitions.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: (): void => {
		console.log('validate: not implemented yet.');
	}
});

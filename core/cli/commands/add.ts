import { command, type Command } from 'clinguini';

export const addCommand: Command = command({
	name: 'add',
	description: 'Install a community test.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: ({ params }): void => {
		console.log(`add ${params.id}: scaffold only.`);
	}
});

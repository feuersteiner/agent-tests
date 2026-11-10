import { command, type Command } from 'clinguini';

export const voteCommand: Command = command({
	name: 'vote',
	description: 'Toggle a vote for a community test.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: ({ params }): void => {
		console.log(`vote ${params.id}: scaffold only.`);
	}
});

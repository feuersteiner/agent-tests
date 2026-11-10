import { command } from 'clinguini';
import { stubHandler } from '../stub.ts';

export const voteCommand = command({
	name: 'vote',
	description: 'Toggle a vote for a community test.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: stubHandler('vote')
});

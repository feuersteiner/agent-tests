import { command } from 'clinguini';
import { stubHandler } from './stub.ts';

export const addCommand = command({
	name: 'add',
	description: 'Install a community test.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: stubHandler('add')
});

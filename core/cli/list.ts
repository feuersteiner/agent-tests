import { command } from 'clinguini';
import { stubHandler } from './stub.ts';

export const listCommand = command({
	name: 'list',
	description: 'List installed tests.',
	handler: stubHandler('list')
});

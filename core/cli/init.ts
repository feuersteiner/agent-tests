import { command } from 'clinguini';
import { stubHandler } from './stub.ts';

export const initCommand = command({
	name: 'init',
	description: 'Initialize repository test configuration and setup.',
	handler: stubHandler('init')
});

import { command } from 'clinguini';
import { stubHandler } from './stub.ts';

export const docsCommand = command({
	name: 'docs',
	description: 'Show skills for writing and running tests.',
	handler: stubHandler('docs')
});

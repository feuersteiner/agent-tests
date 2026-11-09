import { command } from 'clinguini';
import { stubHandler } from './stub.ts';

export const targetsCommand = command({
	name: 'targets',
	description: 'Show files or directories a test would inspect.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: stubHandler('targets')
});

import { command } from 'clinguini';
import { stubHandler } from './stub.ts';

export const validateCommand = command({
	name: 'validate',
	description: 'Validate test definitions.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: stubHandler('validate')
});

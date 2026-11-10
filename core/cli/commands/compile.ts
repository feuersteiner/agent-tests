import { command } from 'clinguini';
import { stubHandler } from '../stub.ts';

export const compileCommand = command({
	name: 'compile',
	description: 'Compile a test rule into a test definition.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: stubHandler('compile')
});

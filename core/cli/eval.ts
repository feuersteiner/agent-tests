import { command } from 'clinguini';
import { stubHandler } from './stub.ts';

export const evalCommand = command({
	name: 'eval',
	description: 'Run labeled test examples.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: stubHandler('eval')
});

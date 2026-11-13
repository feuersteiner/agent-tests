import { command, type Command } from 'clinguini';

export const evalCommand: Command = command({
	name: 'eval',
	description: 'Run labeled test examples.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: (): void => {
		console.log('eval: not implemented yet.');
	}
});

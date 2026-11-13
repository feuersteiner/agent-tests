import { command, type Command } from 'clinguini';

export const runCommand: Command = command({
	name: 'run',
	description: 'Run repository tests.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	flags: [
		{ name: 'changed', type: 'boolean', description: 'Select uncommitted files.' },
		{ name: 'staged', type: 'boolean', description: 'Select staged files.' },
		{ name: 'base', type: 'string', description: 'Select changes against a base ref.' }
	],
	handler: (): void => {
		console.log('run: not implemented yet.');
	}
});

import { command, type Command } from 'clinguini';
import { loadRunner } from '../config/index.ts';

export const runCommand: Command = command({
	name: 'run',
	description: 'Run repository tests.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	flags: [
		{ name: 'changed', type: 'boolean', description: 'Select uncommitted files.' },
		{ name: 'staged', type: 'boolean', description: 'Select staged files.' },
		{ name: 'base', type: 'string', description: 'Select changes against a base ref.' }
	],
	handler: async ({ params, flags }): Promise<void> => {
		const runner = loadRunner(params.id);
		console.log(`Loaded config and ${runner.tests.length} agent test(s).`);
		if (flags.changed || flags.staged || flags.base)
			console.log('Git scope selection is pending; running all repository sources.');
		const results = await runner.run();
		const failures = results.reduce((count, result) => count + result.check.flagged.length, 0);
		console.log(`Run complete: ${failures} finding(s).`);
		if (failures) process.exitCode = 1;
	}
});

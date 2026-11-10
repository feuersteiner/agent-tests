import { command, type Command } from 'clinguini';
import { loadRunner } from '../config/index.ts';

export const targetsCommand: Command = command({
	name: 'targets',
	description: 'Show files a test would inspect.',
	params: [{ name: 'id', description: 'Exact test ID.' }],
	handler: ({ params }): void => {
		const runner = loadRunner(params.id);
		console.log(`Loaded config and ${runner.tests.length} agent test(s).`);
		console.log(`targets ${params.id}: loaded successfully; action is scaffolded.`);
	}
});

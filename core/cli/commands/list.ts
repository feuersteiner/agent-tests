import { command, type Command } from 'clinguini';
import { loadRunner } from '../config/index.ts';

export const listCommand: Command = command({
	name: 'list',
	description: 'List installed tests.',
	handler: (): void => {
		const runner = loadRunner();
		console.log(`Loaded config and ${runner.tests.length} agent test(s).`);
		for (const test of runner.tests) console.log(`${test.id}: ${test.title}`);
	}
});

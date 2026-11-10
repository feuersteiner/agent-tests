import { command, type Command } from 'clinguini';
import { loadRunner } from '../config/index.ts';

export const evalCommand: Command = command({
	name: 'eval',
	description: 'Run labeled test examples.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: async ({ params }): Promise<void> => {
		const runner = loadRunner(params.id);
		console.log(`Loaded config and ${runner.tests.length} agent test(s).`);
		const results = await runner.eval();
		const failures = results.reduce((count, result) => count + result.result.flagged.length, 0);
		const matched = results.reduce((count, result) => count + result.result.cleared.length, 0);
		console.log(`Eval complete: ${matched} matched example(s), ${failures} mismatch(es).`);
		if (failures) process.exitCode = 1;
	}
});

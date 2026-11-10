import { createInterface } from 'node:readline/promises';
import type { Interface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const cwd: string = fileURLToPath(new URL('./repository/', import.meta.url));
const cli: string = fileURLToPath(new URL('../cli/index.ts', import.meta.url));
const commands: string[][] = [
	['--help'],
	['init'],
	['add', 'no-todo'],
	['list'],
	['validate'],
	['validate', 'no-todo'],
	['targets', 'no-todo'],
	['compile', 'no-todo'],
	['eval'],
	['eval', 'no-todo'],
	['run'],
	['run', 'no-todo'],
	['run', '--changed'],
	['run', '--staged'],
	['run', '--base', 'main'],
	['docs'],
	['vote', 'no-todo']
];
const prompt: Interface | undefined =
	process.stdin.isTTY && process.stdout.isTTY
		? createInterface({ input: process.stdin, output: process.stdout })
		: undefined;
prompt?.on('SIGINT', (): never => process.exit(130));

try {
	for (const [index, args] of commands.entries()) {
		console.log(`\n${'─'.repeat(60)}\nStep ${index + 1} of ${commands.length}`);
		console.log(`$ agent-tests ${args.join(' ')}`);
		if (prompt) await prompt.question('Press Enter to run (Ctrl+C to stop)… ');
		const result = Bun.spawnSync([process.execPath, '--no-env-file', cli, ...args], {
			cwd,
			env: { ...process.env, AGENT_TESTS_FIXTURE_KEY: 'fixture-only' },
			stdout: 'inherit',
			stderr: 'inherit'
		});
		if (result.exitCode !== 0) throw new Error(`Command failed with exit ${result.exitCode}`);
	}
	console.log(`\n${commands.length} commands executed successfully.`);
} finally {
	prompt?.close();
}

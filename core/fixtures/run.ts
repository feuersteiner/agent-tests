import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface, type Interface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { loadDefinitions } from '../cli/config/definitions.ts';
import { startModel } from './model/server.ts';
import { createSteps } from './scenarios.ts';
import type { DemoStep } from './scenarios.ts';
import { changeFile, createWorkspace } from './workspace.ts';

const cli: string = fileURLToPath(new URL('../cli/index.ts', import.meta.url));
const model: Bun.Server<undefined> = startModel();
let cwd: string | undefined;
let child: Bun.Subprocess<'ignore', 'pipe', 'pipe'> | undefined;
const prompt: Interface | undefined =
	process.stdin.isTTY && process.stdout.isTTY
		? createInterface({ input: process.stdin, output: process.stdout })
		: undefined;
const cleanup = (): void => {
	child?.kill();
	prompt?.close();
	model.stop(true);
	if (cwd) rmSync(cwd, { recursive: true, force: true });
};
const interrupt = (): never => {
	cleanup();
	process.exit(130);
};
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
prompt?.on('SIGINT', interrupt);

try {
	cwd = createWorkspace(`http://localhost:${model.port}/v1`);
	const steps: DemoStep[] = createSteps(loadDefinitions(join(cwd, '.agents/tests')));
	console.log('Demo uses a temporary repository and a local stub model. No external AI calls.');
	for (const [index, step] of steps.entries()) {
		console.log(`\n${'─'.repeat(60)}\nStep ${index + 1} of ${steps.length}: ${step.title}`);
		console.log(`$ agent-tests ${step.args.join(' ')} (expected exit ${step.exitCode})`);
		if (step.change) console.log(`Temporary change: ${step.change.path}`);
		if (prompt) await prompt.question('Press Enter to run (Ctrl+C to stop)… ');
		const restore: (() => void) | undefined = step.change
			? changeFile(cwd, step.change)
			: undefined;
		try {
			child = Bun.spawn([process.execPath, '--no-env-file', cli, ...step.args], {
				cwd,
				env: { ...process.env, AGENT_TESTS_FIXTURE_KEY: 'fixture-only' },
				stdin: 'ignore',
				stdout: 'pipe',
				stderr: 'pipe'
			});
			const [exitCode, stdout, stderr] = await Promise.all([
				child.exited,
				new Response(child.stdout).text(),
				new Response(child.stderr).text()
			]);
			child = undefined;
			process.stdout.write(stdout);
			process.stderr.write(stderr);
			if (exitCode !== step.exitCode || !(stdout + stderr).includes(step.output))
				throw new Error(
					`Demo failed: expected exit ${step.exitCode} and ${JSON.stringify(step.output)}; got exit ${exitCode}`
				);
			console.log(`Verified expected exit ${exitCode}.`);
		} finally {
			restore?.();
			if (restore) console.log('Temporary change removed; original fixture restored.');
		}
	}
	console.log(`\n${steps.length} demo steps verified. Nothing was committed.`);
} finally {
	cleanup();
	process.off('SIGINT', interrupt);
	process.off('SIGTERM', interrupt);
}

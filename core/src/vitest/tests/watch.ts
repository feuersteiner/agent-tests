import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface WatchRun {
	waitForFailures: (count: number) => Promise<void>;
	close: () => Promise<void>;
}

/** Start the real CLI in watch mode and observe current reports without masking its failures. */
export const startPluginWatch = (root: string, environment: NodeJS.ProcessEnv = {}): WatchRun => {
	const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
	const child = spawn(
		process.execPath,
		[
			join(repository, 'node_modules/vitest/vitest.mjs'),
			'--watch',
			'--config',
			join(root, 'vitest.config.mts'),
			'--maxWorkers',
			'1',
			'--reporter=json',
			'--outputFile',
			join(root, 'watch-results.json')
		],
		{
			cwd: root,
			env: { ...process.env, CI: '', ...environment },
			stdio: ['ignore', 'pipe', 'pipe']
		}
	);
	let output = '';
	child.stdout.on('data', (chunk: Buffer) => {
		output += chunk.toString();
	});
	child.stderr.on('data', (chunk: Buffer) => {
		output += chunk.toString();
	});
	return {
		waitForFailures: async (count) => {
			const deadline = Date.now() + 10_000;
			while (Date.now() < deadline) {
				try {
					const report = JSON.parse(await readFile(join(root, 'watch-results.json'), 'utf8')) as {
						numFailedTests: number;
						numTotalTests: number;
					};
					if (report.numTotalTests >= 2 && report.numFailedTests === count) return;
				} catch {
					/* Reporter writes are observed after completion. */
				}
				if (child.exitCode !== null) throw new Error(`Watch exited early: ${output}`);
				await new Promise((done) => setTimeout(done, 50));
			}
			const report = await readFile(join(root, 'watch-results.json'), 'utf8').catch(() => 'absent');
			throw new Error(`Timed out waiting for ${count} failures: ${output}\n${report}`);
		},
		close: async () => {
			if (child.exitCode !== null) return;
			const closed = new Promise<void>((done) => child.once('close', () => done()));
			child.kill('SIGTERM');
			const timeout = setTimeout(() => child.kill('SIGKILL'), 3_000);
			await closed;
			clearTimeout(timeout);
		}
	};
};

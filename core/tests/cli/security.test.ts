import { afterEach, describe, expect, test } from 'bun:test';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runCli } from '../helpers/cli.ts';
import { rawPolicy } from '../helpers/security.ts';
import { toYaml } from '../helpers/fixtures.ts';
import { inTempDir } from '../helpers/temp.ts';

const CLI = fileURLToPath(new URL('../../dist/cli/index.js', import.meta.url));

let child: ChildProcess | undefined;
afterEach(() => {
	child?.kill();
	child = undefined;
});

/** Start `agentests security mock` on a free port in another process (runCli blocks this one) and return its URL. */
const startMock = (...args: string[]): Promise<string> =>
	new Promise((resolve, reject) => {
		child = spawn('node', [CLI, 'security', 'mock', '--port', '0', ...args], {
			env: { PATH: process.env.PATH ?? '' }
		});
		let out = '';
		child.stdout!.on('data', (chunk) => {
			out += String(chunk);
			const match = out.match(/listening on (http:\/\/\S+)/);
			if (match) resolve(match[1]!);
		});
		child.once('exit', (code) => reject(new Error(`mock exited ${code}: ${out}`)));
	});

/** The policy file for a mock at `url`: 30 unpaced requests, so the mock's 20-a-second limit fires. */
const policyFile = (url: string, overrides: Record<string, unknown> = {}) => ({
	'agentests.security.yaml': toYaml(rawPolicy(url, overrides))
});

describe('agentests security', () => {
	test('run exits 0 with a PASS line when the defense holds', async () => {
		const url = await startMock();
		await inTempDir(policyFile(url), (dir) => {
			const result = runCli(['security', 'run'], { cwd: dir });
			expect(result.exitCode).toBe(0);
			expect(result.lines[1]).toStartWith(
				'PASS  rate-limit  rate_limit_enforced: expected true, got true'
			);
			expect(result.lines.at(-1)).toBe('Result: 1 of 1 security test(s) passed.');
		});
	});

	test('run exits 1 with a FAIL line when the rate limit was removed', async () => {
		const url = await startMock('--disable', 'rate-limit');
		await inTempDir(policyFile(url), (dir) => {
			const result = runCli(['security', 'run'], { cwd: dir });
			expect(result.exitCode).toBe(1);
			expect(result.lines[1]).toBe(
				'FAIL  rate-limit  rate_limit_enforced: expected true, got false (no rate-limited response in 30 requests)'
			);
		});
	});

	test('run --json prints the report alone', async () => {
		const url = await startMock();
		await inTempDir(policyFile(url), (dir) => {
			const result = runCli(['security', 'run', '--json'], { cwd: dir });
			const report = JSON.parse(result.stdout);
			expect(report).toMatchObject({ policy: 'extraction', passed: 1, total: 1 });
			expect(report.results[0].evidence).toMatchObject({
				sent: 30,
				succeeded: 20,
				rateLimited: 10,
				firstRateLimit: 21
			});
		});
	});

	test('run --policy reads another file', async () => {
		const url = await startMock();
		await inTempDir({ 'policies/api.yaml': policyFile(url)['agentests.security.yaml'] }, (dir) => {
			expect(
				runCli(['security', 'run', '--policy', 'policies/api.yaml'], { cwd: dir }).exitCode
			).toBe(0);
		});
	});

	test('an unreachable target exits 2', async () => {
		await inTempDir(policyFile('http://127.0.0.1:9'), (dir) => {
			const result = runCli(['security', 'run'], { cwd: dir });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toStartWith('Error: http://127.0.0.1:9/v1/complete unreachable');
		});
	});

	test('a production target exits 2 before sending anything', async () => {
		const target = { url: 'https://api.example.com/v1', environment: 'production' };
		const safety = {
			max_requests: 100,
			allow_production: true,
			allowed_hosts: ['api.example.com']
		};
		await inTempDir(policyFile('http://unused', { target, safety }), (dir) => {
			const result = runCli(['security', 'run'], { cwd: dir });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toBe(
				'Error: target.environment: Production targets need the --allow-production flag\n'
			);
		});
	});

	test('validate reports the request budget', async () => {
		await inTempDir(policyFile('http://127.0.0.1:4010'), (dir) => {
			const result = runCli(['security', 'validate'], { cwd: dir });
			expect(result.exitCode).toBe(0);
			expect(result.lines).toEqual([
				'Policy extraction valid: 1 security test(s), 30 of 100 request(s).'
			]);
		});
	});

	test('a missing policy exits 2', async () => {
		await inTempDir({}, (dir) => {
			const result = runCli(['security', 'validate'], { cwd: dir });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toBe('Error: Missing agentests.security.yaml\n');
		});
	});

	test('mock rejects an unknown defense', async () => {
		await inTempDir({}, (dir) => {
			const result = runCli(['security', 'mock', '--disable', 'firewall'], { cwd: dir });
			expect(result.exitCode).toBe(2);
			expect(result.stderr).toBe(
				'Error: Unknown defense: firewall; use rate-limit, quota, or detection\n'
			);
		});
	});
});

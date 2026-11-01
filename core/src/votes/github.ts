import { spawn } from 'node:child_process';
import type { GhRunner } from './types.js';

/** Run noninteractive gh with bounded output and sanitized authentication/network failures. */
export const runGh: GhRunner = (args, body) =>
	new Promise((resolve, reject) => {
		const child = spawn('gh', args, {
			env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' },
			stdio: ['pipe', 'pipe', 'pipe']
		});
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (chunk: Buffer) => {
			stdout += chunk.toString();
			if (stdout.length > 8_000_000) child.kill();
		});
		child.stderr.on('data', (chunk: Buffer) => {
			stderr = (stderr + chunk.toString()).slice(-8_000);
		});
		child.on('error', () => reject(new Error('GitHub CLI is unavailable; install gh first.')));
		child.on('close', (code) => {
			if (code === 0) resolve(stdout.trim());
			else {
				const status = /HTTP (\d{3})/.exec(stderr)?.[1];
				reject(
					Object.assign(new Error('GitHub operation failed; check gh access and permissions.'), {
						...(status ? { status: Number(status) } : {})
					})
				);
			}
		});
		child.stdin.on('error', () => undefined);
		child.stdin.end(body === undefined ? undefined : JSON.stringify(body));
	});

/** Parse a gh API response without including untrusted response contents in failures. */
export const api = async <T>(
	gh: GhRunner,
	path: string,
	method = 'GET',
	body?: unknown
): Promise<T> => {
	const output = await gh(
		['api', path, '--method', method, ...(body === undefined ? [] : ['--input', '-'])],
		body
	);
	try {
		return JSON.parse(output || 'null') as T;
	} catch {
		throw new Error('GitHub returned an invalid response.');
	}
};

/** Reject remote identities and test IDs that could escape API paths or become CLI options. */
export const validateTarget = (repository: string, id?: string): void => {
	if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository))
		throw new Error('Expected a GitHub owner/repository.');
	if (id !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
		throw new Error('Expected a lowercase kebab-case test ID.');
};

/** Detect an explicitly reported API status without inspecting credential values. */
export const hasStatus = (error: unknown, status: number): boolean =>
	typeof error === 'object' && error !== null && 'status' in error && error.status === status;

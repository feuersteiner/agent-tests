import { spawn } from 'node:child_process';
import type { GhRunner } from './types.js';

/**
 * Run noninteractive gh with bounded output and sanitized transport failures.
 * @param args CLI arguments passed directly to spawn, never a shell.
 * @param body Optional JSON body written to stdin.
 * @returns Trimmed stdout when gh succeeds.
 * @throws Rejects unavailable gh or a nonzero exit, preserving an HTTP status if present.
 */
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

/**
 * Send a GitHub API request and parse its JSON response.
 * @param gh Injected transport.
 * @param path API endpoint relative to GitHub's API root.
 * @param method HTTP method, defaulting to read-only GET.
 * @param body Optional JSON payload; enables stdin input when provided.
 * @returns Parsed response, treating empty output as null.
 * @throws Propagates transport errors or rejects malformed JSON without response contents.
 */
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

/**
 * Validate identities before constructing paths or passing CLI arguments.
 * @param repository GitHub owner/repository.
 * @param id Optional lowercase kebab-case library test ID.
 * @throws Rejects identities that could escape API paths or become CLI options.
 */
export const validateTarget = (repository: string, id?: string): void => {
	if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository))
		throw new Error('Expected a GitHub owner/repository.');
	if (id !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
		throw new Error('Expected a lowercase kebab-case test ID.');
};

/**
 * Detect an explicitly reported API status without inspecting credentials.
 * @param error Unknown transport failure.
 * @param status Expected HTTP status code.
 * @returns Whether the failure explicitly exposes that status.
 */
export const hasStatus = (error: unknown, status: number): boolean =>
	typeof error === 'object' && error !== null && 'status' in error && error.status === status;

const handle = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;

/**
 * Parse a canonical score file without mutation.
 * @param text Complete CSV, including its final LF.
 * @returns GitHub handle rows in their original order.
 * @throws Rejects missing LF, invalid header/handles, hidden rows and duplicates.
 */
export const scoreRows = (text: string): string[] => {
	if (!text.endsWith('\n')) throw new Error('score.csv must end with a newline.');
	const [header, ...rows] = text.slice(0, -1).split('\n');
	if (header !== 'github_handle' || rows.some((row) => !handle.test(row)))
		throw new Error('score.csv has an invalid header or GitHub handle.');
	if (new Set(rows.map((row) => row.toLowerCase())).size !== rows.length)
		throw new Error('score.csv contains duplicate handles.');
	return rows;
};

/**
 * Change only the authenticated user's row while preserving other rows and their order.
 * @param text Canonical existing score CSV.
 * @param login Validated authenticated handle.
 * @param up Whether that handle should be present.
 * @returns Canonical CSV containing the requested row change.
 * @throws Rejects an invalid handle or malformed existing score.
 */
export const updateScore = (text: string, login: string, up: boolean): string => {
	if (!handle.test(login)) throw new Error('GitHub returned an invalid account handle.');
	const rows = scoreRows(text);
	const index = rows.findIndex((row) => row.toLowerCase() === login.toLowerCase());
	if (up && index < 0) rows.push(login);
	if (!up && index >= 0) rows.splice(index, 1);
	return ['github_handle', ...rows].join('\n') + '\n';
};

/**
 * Serialize protection recursively with sorted object keys for stable comparison.
 * @param value JSON-like protection snapshot.
 * @returns Fingerprint insensitive to object key ordering; array ordering is preserved.
 */
export const protectionFingerprint = (value: unknown): string => {
	if (Array.isArray(value)) return `[${value.map(protectionFingerprint).join(',')}]`;
	if (typeof value === 'object' && value !== null)
		return `{${Object.entries(value)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, item]) => `${JSON.stringify(key)}:${protectionFingerprint(item)}`)
			.join(',')}}`;
	return JSON.stringify(value) ?? 'null';
};

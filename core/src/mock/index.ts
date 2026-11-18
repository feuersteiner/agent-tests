import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

/** The defenses the mock can run; leave one out to simulate the regression where it was removed. */
export interface MockDefenses {
	/** At most `requests` per API key in each fixed `windowMs` window, counted from the key's first request. */
	rateLimit?: { requests: number; windowMs: number };
	/** At most `requests` successful requests per API key, ever; later ones get `429 insufficient_quota`. */
	quota?: { requests: number };
	/** One event when a key sends `threshold` prompts that are the same once digits are masked. */
	detection?: { threshold: number };
}

/** The defenses of a correctly protected API: 20 requests a second, 60 in total, and a flag after 25 templated prompts. */
export const PROTECTED_DEFENSES: Required<MockDefenses> = {
	rateLimit: { requests: 20, windowMs: 1_000 },
	quota: { requests: 60 },
	detection: { threshold: 25 }
};

/** One detection event, as `GET /v1/security/events` lists it. */
export interface MockEvent {
	type: 'systematic-query-pattern';
	key: string;
	template: string;
	count: number;
	run?: string;
}

/** A running mock: its base URL, the events it raised, and a way to stop it. */
export interface MockApi {
	url: string;
	events: MockEvent[];
	close: () => Promise<void>;
}

interface KeyState {
	windowStart: number;
	windowCount: number;
	used: number;
	templates: Map<string, number>;
	flagged: Set<string>;
}

/** Digits masked, so a grid of inputs collapses to its template. */
const toTemplate = (prompt: string): string => prompt.replace(/\d+/g, '#');

/** The prompt of a request body: its `prompt` string, or the last `messages` entry's `content`. */
const toPrompt = (body: unknown): string => {
	if (!body || typeof body !== 'object') return '';
	if ('prompt' in body && typeof body.prompt === 'string') return body.prompt;
	if ('messages' in body && Array.isArray(body.messages)) {
		const last: unknown = body.messages.at(-1);
		if (last && typeof last === 'object' && 'content' in last && typeof last.content === 'string')
			return last.content;
	}
	return '';
};

const json = (
	response: ServerResponse,
	status: number,
	value: unknown,
	headers: Record<string, string> = {}
): void => {
	response.writeHead(status, { 'content-type': 'application/json', ...headers });
	response.end(JSON.stringify(value));
};

const readBody = async (request: IncomingMessage): Promise<unknown> => {
	const chunks: Buffer[] = [];
	for await (const chunk of request) chunks.push(chunk as Buffer);
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		return undefined;
	}
};

/**
 * Start a local stand-in for an AI completion API, for demos and tests; it binds to 127.0.0.1 only.
 * - `POST /v1/complete`: `{ prompt }` or `{ messages }`, keyed by the `authorization` header; answers `{ completion }`.
 * - `GET /v1/security/events`: `{ events }`, every detection event so far.
 * Pass `port: 0` for a free port.
 */
export const startMockApi = async ({
	port = 4010,
	defenses = PROTECTED_DEFENSES,
	now = Date.now
}: { port?: number; defenses?: MockDefenses; now?: () => number } = {}): Promise<MockApi> => {
	const keys = new Map<string, KeyState>();
	const events: MockEvent[] = [];

	const complete = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
		const body = await readBody(request);
		const key = request.headers.authorization ?? 'anonymous';
		const state =
			keys.get(key) ??
			({
				windowStart: now(),
				windowCount: 0,
				used: 0,
				templates: new Map(),
				flagged: new Set()
			} satisfies KeyState);
		keys.set(key, state);
		const { quota, rateLimit, detection } = defenses;
		if (quota && state.used >= quota.requests)
			return json(response, 429, {
				error: { code: 'insufficient_quota', message: 'You exceeded your current quota.' }
			});
		if (rateLimit) {
			const time = now();
			if (time - state.windowStart >= rateLimit.windowMs) {
				state.windowStart = time;
				state.windowCount = 0;
			}
			if (state.windowCount >= rateLimit.requests) {
				const retry = Math.ceil((state.windowStart + rateLimit.windowMs - time) / 1000);
				return json(
					response,
					429,
					{ error: { code: 'rate_limit_exceeded', message: 'Too many requests.' } },
					{ 'retry-after': String(Math.max(1, retry)) }
				);
			}
			state.windowCount++;
		}
		state.used++;
		const prompt = toPrompt(body);
		if (detection && prompt) {
			const template = toTemplate(prompt);
			const count = (state.templates.get(template) ?? 0) + 1;
			state.templates.set(template, count);
			if (count >= detection.threshold && !state.flagged.has(template)) {
				state.flagged.add(template);
				const run = request.headers['x-agentests-run'];
				events.push({
					type: 'systematic-query-pattern',
					key: key.slice(0, 12),
					template,
					count,
					...(typeof run === 'string' ? { run } : {})
				});
			}
		}
		json(response, 200, { completion: `Mock answer to: ${prompt.slice(0, 80)}` });
	};

	const server: Server = createServer((request, response) => {
		const path = new URL(request.url ?? '/', 'http://localhost').pathname;
		if (request.method === 'POST' && path === '/v1/complete') {
			complete(request, response).catch(() => json(response, 500, { error: 'internal' }));
			return;
		}
		if (request.method === 'GET' && path === '/v1/security/events')
			return json(response, 200, { events });
		json(response, 404, { error: 'not found' });
	});

	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(port, '127.0.0.1', () => resolve());
	});
	const { port: bound } = server.address() as AddressInfo;
	return {
		url: `http://127.0.0.1:${bound}`,
		events,
		close: () =>
			new Promise<void>((resolve) => {
				server.closeAllConnections();
				server.close(() => resolve());
			})
	};
};

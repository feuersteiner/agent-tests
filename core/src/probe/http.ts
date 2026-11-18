import { message } from './utils.ts';

/** The values `{{…}}` placeholders resolve to for one request. */
export type Placeholders = Record<string, string>;

/** Replace `${VAR}` with the environment map's value, throwing on an unset variable, then `{{name}}` with its placeholder. */
export const expand = (
	text: string,
	env: Record<string, string | undefined>,
	placeholders: Placeholders = {}
): string =>
	text
		.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name: string) => {
			const value = env[name];
			if (value === undefined || value === '')
				throw new Error(`Missing environment variable: ${name}`);
			return value;
		})
		.replace(/\{\{([a-z_]+)\}\}/g, (match, name: string) => placeholders[name] ?? match);

/** `expand` applied to every string inside a JSON-like value. */
export const expandValue = (
	value: unknown,
	env: Record<string, string | undefined>,
	placeholders: Placeholders
): unknown => {
	if (typeof value === 'string') return expand(value, env, placeholders);
	if (Array.isArray(value)) return value.map((item) => expandValue(item, env, placeholders));
	if (value && typeof value === 'object')
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, expandValue(item, env, placeholders)])
		);
	return value;
};

/** `expand` applied to each header value. */
export const expandHeaders = (
	headers: Record<string, string>,
	env: Record<string, string | undefined>,
	placeholders: Placeholders = {}
): Record<string, string> =>
	Object.fromEntries(
		Object.entries(headers).map(([name, value]) => [name, expand(value, env, placeholders)])
	);

/** What the runner keeps of one response. Bodies are cut at 64 KiB: enough to match an error code. */
export interface ProbeResponse {
	status: number;
	body: string;
}

const MAX_BODY = 64 * 1024;

/** POST one JSON request; a network failure or timeout throws, so an unreachable target is an error, never a pass or a fail. */
export const send = async (
	fetcher: typeof fetch,
	url: string,
	headers: Record<string, string>,
	body: unknown,
	timeoutMs: number
): Promise<ProbeResponse> => {
	try {
		const response = await fetcher(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json', ...headers },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(timeoutMs),
			redirect: 'manual'
		});
		const text = await response.text();
		return { status: response.status, body: text.slice(0, MAX_BODY) };
	} catch (error) {
		throw new Error(`${url} unreachable: ${message(error)}`, { cause: error });
	}
};

/** The number of detection events the endpoint reports: a JSON array's length, or the length of an object's `events` array. */
export const countEvents = async (
	fetcher: typeof fetch,
	url: string,
	headers: Record<string, string>,
	timeoutMs: number
): Promise<number> => {
	let response: Response;
	try {
		response = await fetcher(url, {
			headers: { accept: 'application/json', ...headers },
			signal: AbortSignal.timeout(timeoutMs),
			redirect: 'manual'
		});
	} catch (error) {
		throw new Error(`${url} unreachable: ${message(error)}`, { cause: error });
	}
	if (!response.ok) throw new Error(`${url} returned ${response.status}`);
	let value: unknown;
	try {
		value = await response.json();
	} catch {
		throw new Error(`${url} did not return JSON`);
	}
	if (Array.isArray(value)) return value.length;
	if (value && typeof value === 'object' && 'events' in value && Array.isArray(value.events))
		return value.events.length;
	throw new Error(`${url} returned neither an array nor an object with an events array`);
};

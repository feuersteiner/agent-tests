import { AsyncLocalStorage } from 'node:async_hooks';
import type { HttpCall } from './types.ts';

/** The HTTP calls of the decision that is pending in the current async context. */
const pending = new AsyncLocalStorage<HttpCall[]>();

/** The first numeric value among `keys` of a provider's `usage` object. */
const pick = (usage: Record<string, unknown>, keys: string[]): number | undefined =>
	keys.map((key) => usage[key]).find((value): value is number => typeof value === 'number');

/** The token counts of a JSON response body that carries a `usage` object, under either common naming. */
const toUsage = (body: unknown): Pick<HttpCall, 'inputTokens' | 'outputTokens'> => {
	const usage =
		typeof body === 'object' && body !== null && 'usage' in body ? body.usage : undefined;
	if (typeof usage !== 'object' || usage === null) return {};
	const record = usage as Record<string, unknown>;
	return {
		inputTokens: pick(record, ['input_tokens', 'prompt_tokens', 'inputTokens']),
		outputTokens: pick(record, ['output_tokens', 'completion_tokens', 'outputTokens'])
	};
};

/**
 * Wraps the global `fetch` once so that every call made inside `withTap` is timed and its reported
 * token usage kept. The decide engine returns a bare score, so this is the one place usage can be
 * read without changing the package under test. Calls outside `withTap` pass through untouched.
 */
export const installTap = (): void => {
	const original = globalThis.fetch;
	const tapped = async (...args: Parameters<typeof fetch>): Promise<Response> => {
		const calls = pending.getStore();
		if (!calls) return original(...args);
		const started = performance.now();
		const response = await original(...args);
		const call: HttpCall = { ms: performance.now() - started, status: response.status };
		calls.push(call);
		try {
			Object.assign(call, toUsage(await response.clone().json()));
		} catch {
			// A body that is not JSON reports no usage.
		}
		return response;
	};
	globalThis.fetch = Object.assign(tapped, original);
};

/** Runs `work` and returns its result with the HTTP calls it made. */
export const withTap = async <T>(
	work: () => Promise<T>
): Promise<{ result: T; http: HttpCall[] }> => {
	const http: HttpCall[] = [];
	const result = await pending.run(http, work);
	return { result, http };
};

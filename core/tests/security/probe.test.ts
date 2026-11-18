import { afterEach, describe, expect, test } from 'bun:test';
import { startMockApi } from '../../src/mock/index.ts';
import type { MockApi, MockDefenses } from '../../src/mock/index.ts';
import { ProbeOrchestrator, RUN_HEADER, TEST_HEADER } from '../../src/probe/index.ts';
import { scenarioPrompt } from '../../src/probe/scenarios.ts';
import { policyWith } from '../helpers/security.ts';

let api: MockApi | undefined;
afterEach(async () => {
	await api?.close();
	api = undefined;
});

/** A mock on a free loopback port with these defenses. */
const mock = async (defenses: MockDefenses): Promise<MockApi> => {
	api = await startMockApi({ port: 0, defenses });
	return api;
};

const SMALL: MockDefenses = {
	rateLimit: { requests: 5, windowMs: 60_000 },
	quota: { requests: 8 },
	detection: { threshold: 4 }
};

const rateTest = {
	id: 'rate',
	scenario: 'sustained-query-volume',
	requests: 10,
	expect: { rate_limit_enforced: true }
};
const quotaTest = {
	id: 'quota',
	scenario: 'quota-exhaustion',
	requests: 12,
	expect: { quota_enforced: true }
};
const detectTest = {
	id: 'detect',
	scenario: 'systematic-query-pattern',
	requests: 6,
	expect: { detection_event: true }
};

/** A fetch that answers every POST with the next status in `statuses` and counts events as zero. */
const scripted = (statuses: number[], bodies: string[] = []) => {
	const sent: { url: string; init?: RequestInit }[] = [];
	let index = 0;
	const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
		sent.push({ url: String(url), init });
		if (init?.method !== 'POST') return Response.json({ events: [] });
		const i = index++;
		return new Response(bodies[i] ?? '{}', { status: statuses[i] ?? 200 });
	}) as typeof fetch;
	return { fetcher, sent };
};

describe('scenarioPrompt', () => {
	test('is deterministic', () => {
		expect(scenarioPrompt('sustained-query-volume', 7)).toBe(
			scenarioPrompt('sustained-query-volume', 7)
		);
	});

	test('sustained prompts never repeat within the first 216', () => {
		const prompts = Array.from({ length: 216 }, (_, i) =>
			scenarioPrompt('sustained-query-volume', i)
		);
		expect(new Set(prompts).size).toBe(216);
	});

	test('systematic prompts share one template once digits are masked', () => {
		const templates = Array.from({ length: 50 }, (_, i) =>
			scenarioPrompt('systematic-query-pattern', i).replace(/\d+/g, '#')
		);
		expect(new Set(templates).size).toBe(1);
	});
});

describe('ProbeOrchestrator against the mock API', () => {
	test('a tight rate limit fires before the quota when requests are not paced', async () => {
		const { url } = await mock(SMALL);
		const policy = policyWith(url, [
			{ ...rateTest, headers: { authorization: 'k1' } },
			{ ...quotaTest, headers: { authorization: 'k2' } },
			{ ...detectTest, headers: { authorization: 'k3' } }
		]);
		const report = await new ProbeOrchestrator(policy, {}).run();
		expect(report.results.map((r) => [r.test.id, r.passed])).toEqual([
			['rate', true],
			['quota', false],
			['detect', true]
		]);
		// With duration 0, the 5-a-minute rate limit fires before the quota of 8: the quota Test needs its own pacing or key limits.
		expect(report.results[1]!.evidence.firstRateLimit).toBe(6);
	});

	test('quota is enforced and sticky when the rate limit is out of the way', async () => {
		const { url } = await mock({ quota: { requests: 8 } });
		const report = await new ProbeOrchestrator(policyWith(url, [quotaTest]), {}).run();
		const [result] = report.results;
		expect(result!.passed).toBe(true);
		expect(result!.evidence).toMatchObject({
			sent: 12,
			succeeded: 8,
			quotaRejected: 4,
			firstQuota: 9
		});
		expect(result!.checks[0]!.detail).toBe(
			'quota hit at request 9 of 12; every later request rejected'
		);
	});

	test('a removed rate limit fails the rate-limit Test', async () => {
		const { url } = await mock({ quota: SMALL.quota });
		const report = await new ProbeOrchestrator(
			policyWith(url, [{ ...rateTest, requests: 6 }]),
			{}
		).run();
		expect(report.passed).toBe(0);
		expect(report.results[0]!.checks[0]).toEqual({
			expectation: 'rate_limit_enforced',
			expected: true,
			actual: false,
			passed: false,
			detail: 'no rate-limited response in 6 requests'
		});
	});

	test('a removed detector fails the detection Test', async () => {
		const { url } = await mock({});
		const report = await new ProbeOrchestrator(policyWith(url, [detectTest]), {}).run();
		expect(report.results[0]!.evidence.detectionEvents).toBe(0);
		expect(report.results[0]!.passed).toBe(false);
	});

	test('detection counts only events raised during the Test', async () => {
		const { url, events } = await mock({ detection: { threshold: 4 } });
		const policy = policyWith(url, [
			{ ...detectTest, id: 'first', headers: { authorization: 'a' } },
			{ ...detectTest, id: 'second', headers: { authorization: 'a' } }
		]);
		const report = await new ProbeOrchestrator(policy, {}).run();
		expect(events).toHaveLength(1);
		expect(report.results.map((r) => r.evidence.detectionEvents)).toEqual([1, 0]);
	});

	test('run(id) runs one Test; an unknown id throws', async () => {
		const { url } = await mock(SMALL);
		const policy = policyWith(url, [rateTest, detectTest]);
		expect(
			(await new ProbeOrchestrator(policy, {}).run('detect')).results.map((r) => r.test.id)
		).toEqual(['detect']);
		await expect(new ProbeOrchestrator(policy, {}).run('nope')).rejects.toThrow(
			'Unknown security test: nope'
		);
	});

	test('an unreachable target throws instead of passing or failing', async () => {
		const { url } = await mock({});
		await api!.close();
		api = undefined;
		await expect(new ProbeOrchestrator(policyWith(url, [rateTest]), {}).run()).rejects.toThrow(
			'unreachable'
		);
	});
});

describe('ProbeOrchestrator requests', () => {
	test('body and headers expand ${VAR} and {{placeholders}}, and carry the run and test ids', async () => {
		const { fetcher, sent } = scripted([200]);
		const policy = policyWith('http://localhost:1', [
			{
				...rateTest,
				requests: 1,
				expect: { rate_limit_enforced: false },
				headers: { authorization: 'Bearer ${KEY}' }
			}
		]);
		policy.target.body = { messages: [{ role: 'user', content: '{{prompt}}' }], n: '{{index}}' };
		await new ProbeOrchestrator(
			policy,
			{ KEY: 'secret' },
			{ fetch: fetcher, runId: 'run-1' }
		).run();
		const post = sent.find((s) => s.init?.method === 'POST')!;
		const headers = post.init!.headers as Record<string, string>;
		expect(headers.authorization).toBe('Bearer secret');
		expect(headers[RUN_HEADER]).toBe('run-1');
		expect(headers[TEST_HEADER]).toBe('rate');
		expect(JSON.parse(post.init!.body as string)).toEqual({
			messages: [{ role: 'user', content: scenarioPrompt('sustained-query-volume', 0) }],
			n: '0'
		});
	});

	test('a missing environment variable throws before any request', async () => {
		const { fetcher, sent } = scripted([]);
		const policy = policyWith('http://localhost:1', [
			{ ...rateTest, headers: { authorization: '${KEY}' } }
		]);
		await expect(new ProbeOrchestrator(policy, {}, { fetch: fetcher }).run()).rejects.toThrow(
			'Missing environment variable: KEY'
		);
		expect(sent).toHaveLength(0);
	});

	test('a quota that lets traffic through again is not enforced', async () => {
		const quota = '{"error":{"code":"insufficient_quota"}}';
		const { fetcher } = scripted([200, 429, 200], ['{}', quota, '{}']);
		const policy = policyWith('http://localhost:1', [{ ...quotaTest, requests: 3 }]);
		const report = await new ProbeOrchestrator(policy, {}, { fetch: fetcher }).run();
		expect(report.results[0]!.checks[0]).toMatchObject({
			actual: false,
			detail: 'quota hit at request 2, but 1 later requests succeeded'
		});
	});

	test('a 429 without "quota" in the body is a rate limit, not a quota', async () => {
		const { fetcher } = scripted([429], ['{"error":"slow down"}']);
		const policy = policyWith('http://localhost:1', [
			{ ...rateTest, requests: 1, expect: { rate_limit_enforced: true, quota_enforced: false } }
		]);
		const report = await new ProbeOrchestrator(policy, {}, { fetch: fetcher }).run();
		expect(report.results[0]!.passed).toBe(true);
	});

	test('duration_seconds spaces requests evenly', async () => {
		const { fetcher } = scripted([]);
		let clock = 0;
		const waits: number[] = [];
		const policy = policyWith('http://localhost:1', [
			{ ...rateTest, requests: 4, duration_seconds: 2 }
		]);
		await new ProbeOrchestrator(
			policy,
			{},
			{
				fetch: fetcher,
				now: () => clock,
				sleep: async (ms) => {
					waits.push(ms);
					clock += ms;
				}
			}
		).run();
		expect(waits).toEqual([500, 500, 500]);
	});

	test('the run stops at safety.max_requests even if the policy was built without the loader', async () => {
		const { fetcher, sent } = scripted([]);
		const policy = policyWith('http://localhost:1', [rateTest], 10);
		policy.safety.max_requests = 3;
		await expect(new ProbeOrchestrator(policy, {}, { fetch: fetcher }).run()).rejects.toThrow(
			'Stopped at safety.max_requests (3)'
		);
		expect(sent.filter((s) => s.init?.method === 'POST')).toHaveLength(3);
	});
});

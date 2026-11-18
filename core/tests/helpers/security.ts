import type { AgentTestSecurityPolicy } from '../../src/loader/types.ts';
import { validateSecurityPolicy } from '../../src/loader/index.ts';

/** A raw policy, before validation fills defaults: one rate-limit Test against a local mock at `url`. */
export const rawPolicy = (
	url = 'http://127.0.0.1:4010',
	overrides: Record<string, unknown> = {}
) => ({
	version: 1,
	name: 'extraction',
	target: {
		url: `${url}/v1/complete`,
		environment: 'test',
		detection: { url: `${url}/v1/security/events` }
	},
	tests: [
		{
			id: 'rate-limit',
			scenario: 'sustained-query-volume',
			requests: 30,
			expect: { rate_limit_enforced: true }
		}
	],
	safety: { max_requests: 100 },
	...overrides
});

/** `rawPolicy` with these Tests, validated. */
export const policyWith = (url: string, tests: unknown[], max = 500): AgentTestSecurityPolicy =>
	validateSecurityPolicy(rawPolicy(url, { tests, safety: { max_requests: max } }));

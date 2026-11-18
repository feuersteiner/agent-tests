import type {
	AgentTestExpect,
	AgentTestExpectation,
	AgentTestSecurityCheck,
	AgentTestSecurityEvidence
} from './types.ts';

/** What the evidence shows for one expectation, and the sentence explaining it. */
const observe = (
	expectation: AgentTestExpectation,
	evidence: AgentTestSecurityEvidence
): { actual: boolean; detail: string } => {
	const { sent } = evidence;
	switch (expectation) {
		case 'rate_limit_enforced':
			return evidence.firstRateLimit === undefined
				? { actual: false, detail: `no rate-limited response in ${sent} requests` }
				: {
						actual: true,
						detail: `first rate-limited at request ${evidence.firstRateLimit} of ${sent}; ${evidence.rateLimited} rejected`
					};
		case 'quota_enforced':
			if (evidence.firstQuota === undefined)
				return { actual: false, detail: `no quota response in ${sent} requests` };
			if (evidence.succeededAfterQuota > 0)
				return {
					actual: false,
					detail: `quota hit at request ${evidence.firstQuota}, but ${evidence.succeededAfterQuota} later requests succeeded`
				};
			return {
				actual: true,
				detail: `quota hit at request ${evidence.firstQuota} of ${sent}; every later request rejected`
			};
		case 'detection_event': {
			const events = evidence.detectionEvents ?? 0;
			return { actual: events > 0, detail: `${events} new detection event(s)` };
		}
	}
};

/** One check per expectation the Test sets, in a fixed order. */
export const judge = (
	expect: AgentTestExpect,
	evidence: AgentTestSecurityEvidence
): AgentTestSecurityCheck[] =>
	(['rate_limit_enforced', 'quota_enforced', 'detection_event'] as const).flatMap((expectation) => {
		const expected = expect[expectation];
		if (expected === undefined) return [];
		const { actual, detail } = observe(expectation, evidence);
		return [{ expectation, expected, actual, passed: actual === expected, detail }];
	});

import { describe, expect, test } from 'bun:test';
import { parseSecurityPolicy, validateSecurityPolicy } from '../../src/loader/index.ts';
import { rawPolicy } from '../helpers/security.ts';

/** The message validateSecurityPolicy throws for the value; empty when it validates. */
const messageOf = (value: unknown, allowProduction = false): string => {
	try {
		validateSecurityPolicy(value, { allowProduction });
		return '';
	} catch (error) {
		return (error as Error).message;
	}
};

const base = rawPolicy();

describe('validateSecurityPolicy', () => {
	test('a valid policy validates with defaults filled in', () => {
		const policy = validateSecurityPolicy(base);
		expect(policy.target.body).toEqual({ prompt: '{{prompt}}' });
		expect(policy.target.timeout_ms).toBe(10_000);
		expect(policy.target.signals.rate_limit).toEqual({ status: [429] });
		expect(policy.target.signals.quota).toEqual({ status: [402, 403, 429], body: 'quota' });
		expect(policy.tests[0]!.duration_seconds).toBe(0);
		expect(policy.safety).toEqual({
			max_requests: 100,
			allow_production: false,
			allowed_hosts: []
		});
	});

	test('parses YAML text', () => {
		const text = `version: 1
name: x
target: { url: 'http://localhost:1/v1', environment: local }
tests: [{ id: a, scenario: quota-exhaustion, requests: 2, expect: { quota_enforced: true } }]
safety: { max_requests: 2 }
`;
		expect(parseSecurityPolicy(text).tests[0]!.id).toBe('a');
	});

	test('unknown fields and scenarios are schema problems', () => {
		expect(messageOf({ ...base, extra: 1 })).toBe('extra: Unknown field');
		const tests = [{ ...base.tests[0], scenario: 'distillation' }];
		expect(messageOf({ ...base, tests })).toStartWith('tests.0.scenario: ');
	});

	test('an empty expect is rejected', () => {
		const tests = [{ ...base.tests[0], expect: {} }];
		expect(messageOf({ ...base, tests })).toBe('tests.0.expect: Expected at least one expectation');
	});

	test('the tests may not send more than safety.max_requests in total', () => {
		const tests = [base.tests[0], { ...base.tests[0], id: 'second', requests: 80 }];
		expect(messageOf({ ...base, tests })).toBe(
			'safety.max_requests: The tests send 110 requests, over the limit of 100'
		);
	});

	test('duplicate test ids are rejected', () => {
		expect(
			messageOf({ ...base, tests: [base.tests[0], base.tests[0]], safety: { max_requests: 60 } })
		).toBe('tests.1.id: Duplicate test id');
	});

	test('detection_event needs target.detection', () => {
		const tests = [{ ...base.tests[0], expect: { detection_event: true } }];
		const target = { url: base.target.url, environment: 'test' };
		expect(messageOf({ ...base, target, tests })).toBe(
			'tests.0.expect.detection_event: Requires target.detection'
		);
	});

	test('an invalid signal regex is rejected', () => {
		const target = { ...base.target, signals: { quota: { status: [429], body: '(' } } };
		expect(messageOf({ ...base, target })).toBe(
			'target.signals.quota.body: Invalid regular expression'
		);
	});

	test('a non-local host must be listed in safety.allowed_hosts', () => {
		const target = { url: 'https://staging.example.com/v1', environment: 'staging' };
		expect(messageOf({ ...base, target })).toBe(
			'target.url: Host staging.example.com is not authorized; list it in safety.allowed_hosts'
		);
		const safety = { max_requests: 100, allowed_hosts: ['Staging.Example.com'] };
		expect(messageOf({ ...base, target, safety })).toBe('');
	});

	test('the detection host is authorized like the target host', () => {
		const target = { ...base.target, detection: { url: 'https://logs.example.com/events' } };
		expect(messageOf({ ...base, target })).toBe(
			'target.detection.url: Host logs.example.com is not authorized; list it in safety.allowed_hosts'
		);
	});

	test('credentials in the URL are rejected', () => {
		const target = { url: 'http://user:secret@localhost:1/v1', environment: 'local' };
		expect(messageOf({ ...base, target })).toStartWith(
			'target.url: Credentials in the URL are not allowed'
		);
	});

	test('production needs both safety.allow_production and the flag', () => {
		const target = { url: 'https://api.example.com/v1', environment: 'production' };
		const listed = { max_requests: 100, allowed_hosts: ['api.example.com'] };
		expect(messageOf({ ...base, target, safety: listed }, true)).toBe(
			'target.environment: Production targets need safety.allow_production: true'
		);
		const allowed = { ...listed, allow_production: true };
		expect(messageOf({ ...base, target, safety: allowed })).toBe(
			'target.environment: Production targets need the --allow-production flag'
		);
		expect(messageOf({ ...base, target, safety: allowed }, true)).toBe('');
	});

	test('non-HTTP target URLs are rejected', () => {
		const target = { url: 'file:///etc/passwd', environment: 'local' };
		expect(messageOf({ ...base, target })).toStartWith('target.url: ');
	});
});

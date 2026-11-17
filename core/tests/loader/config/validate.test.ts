import { describe, expect, test } from 'bun:test';
import { validateConfig } from '../../../src/loader/index.ts';
import { validConfig } from '../../helpers/fixtures.ts';

/** The fixture config without the given top-level field. */
const omit = (field: string): Record<string, unknown> =>
	Object.fromEntries(Object.entries(validConfig()).filter(([key]) => key !== field));

/** The fixture config with fields of one model section replaced. */
const withModel = (
	section: 'decision' | 'reasoning',
	fields: Record<string, unknown>
): Record<string, unknown> => ({
	...validConfig(),
	[section]: { ...validConfig()[section], ...fields }
});

/** The message of the error validateConfig throws for the value; empty when it validates. */
const messageOf = (value: unknown): string => {
	try {
		validateConfig(value);
		return '';
	} catch (error) {
		return (error as Error).message;
	}
};

describe('validateConfig', () => {
	test('a valid config is returned as given', () => {
		expect(validateConfig(validConfig())).toEqual(validConfig());
	});

	test.each(['decision', 'reasoning'])('the %s model section is required', (section) => {
		expect(() => validateConfig(omit(section))).toThrow(`${section}: `);
	});

	test.each([
		['decision', 'openai'],
		['decision', 'jev'],
		['reasoning', 'openai'],
		['reasoning', 'anthropic']
	] as const)('the %s section accepts api %s', (section, api) => {
		expect(validateConfig(withModel(section, { api }))[section].api).toBe(api);
	});

	test.each([
		['decision', 'anthropic'],
		['decision', 'gemini'],
		['reasoning', 'jev'],
		['reasoning', 'gemini']
	] as const)('the %s section rejects api %s', (section, api) => {
		expect(() => validateConfig(withModel(section, { api }))).toThrow(`${section}.api: `);
	});

	describe.each(['decision', 'reasoning'] as const)('the %s model URL', (section) => {
		test.each([
			'https://api.example.com/v1',
			'https://localhost:8443/v1',
			'http://localhost:11434/v1',
			'http://localhost'
		])('accepts %s', (url) => {
			expect(validateConfig(withModel(section, { url }))[section].url).toBe(url);
		});

		test.each([
			['HTTP off localhost', 'http://api.example.com/v1'],
			['HTTP on a host that only starts with localhost', 'http://localhost.example.com/v1'],
			['another scheme', 'ftp://api.example.com/v1'],
			['a user name', 'https://user@api.example.com/v1'],
			['a user name and password', 'https://user:secret@api.example.com/v1'],
			['a query', 'https://api.example.com/v1?key=secret'],
			['an empty query', 'https://api.example.com/v1?'],
			['a fragment', 'https://api.example.com/v1#part'],
			['an empty fragment', 'https://api.example.com/v1#']
		])('rejects %s', (_name, url) => {
			expect(() => validateConfig(withModel(section, { url }))).toThrow(
				`${section}.url: Expected HTTPS or HTTP localhost without credentials, query, or fragment`
			);
		});

		test('rejects text that is not a URL', () => {
			expect(() => validateConfig(withModel(section, { url: 'not a url' }))).toThrow(
				`${section}.url: `
			);
		});
	});

	describe.each(['decision', 'reasoning'] as const)('the %s apiKeyEnv', (section) => {
		test.each(['DECISION_KEY', '_KEY', 'key2', 'K'])(
			'accepts the variable name %s',
			(apiKeyEnv) => {
				expect(validateConfig(withModel(section, { apiKeyEnv }))[section].apiKeyEnv).toBe(
					apiKeyEnv
				);
			}
		);

		test.each(['', '2KEY', 'MY-KEY', 'MY KEY', '$KEY', 'sk-abc123'])(
			'rejects %p, which is not a variable name',
			(apiKeyEnv) => {
				expect(() => validateConfig(withModel(section, { apiKeyEnv }))).toThrow(
					`${section}.apiKeyEnv: Expected an environment variable name`
				);
			}
		);
	});

	describe.each(['select', 'assert'] as const)('the %s threshold', (section) => {
		test.each([0, 0.5, 1])('accepts %p', (threshold) => {
			expect(
				validateConfig({ ...validConfig(), [section]: { threshold } })[section].threshold
			).toBe(threshold);
		});

		test.each([-0.01, 1.01, '0.5'])('rejects %p', (threshold) => {
			expect(() => validateConfig({ ...validConfig(), [section]: { threshold } })).toThrow(
				`${section}.threshold: `
			);
		});
	});

	test.each([
		['at the top level', { ...validConfig(), extra: true }, 'extra: Unknown field'],
		[
			'in a model section',
			withModel('decision', { apiKey: 'x' }),
			'decision.apiKey: Unknown field'
		],
		[
			'in a threshold section',
			{ ...validConfig(), select: { threshold: 0.5, limit: 3 } },
			'select.limit: Unknown field'
		]
	])('rejects an unknown field %s', (_name, config, message) => {
		expect(() => validateConfig(config)).toThrow(message);
	});

	test('rejects an ignore glob starting with !', () => {
		expect(() => validateConfig(validConfig({ ignore: ['dist/**', '!dist/keep'] }))).toThrow(
			'ignore.1: Globs cannot start with "!"'
		);
	});

	test('a config with a schema problem and a rule problem reports only the schema problem', () => {
		const config = { ...validConfig({ ignore: ['!dist'] }), extra: true };
		expect(messageOf(config)).toBe('extra: Unknown field');
	});

	test('a config with a valid schema reports every rule problem, one per line', () => {
		const config = {
			...withModel('decision', { url: 'http://decision.invalid/v1' }),
			ignore: ['!dist']
		};
		expect(messageOf(config)).toBe(
			'decision.url: Expected HTTPS or HTTP localhost without credentials, query, or fragment\n' +
				'ignore.0: Globs cannot start with "!"; exclude with an extglob like "!(pattern)"'
		);
	});

	test('accepts an ignore glob starting with a !(…) extglob', () => {
		expect(validateConfig(validConfig({ ignore: ['!(src)/**'] })).ignore).toEqual(['!(src)/**']);
	});
});

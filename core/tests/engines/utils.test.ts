import { describe, expect, test } from 'bun:test';
import { providerSettings } from '../../src/engines/utils.ts';
import { validConfig } from '../helpers/fixtures.ts';

const decision = validConfig().decision;

describe('providerSettings', () => {
	test('returns the API key from the variable the section names', () => {
		const settings = { ...decision, apiKeyEnv: 'TEAM_KEY' };
		const env = { TEAM_KEY: 'fake-team-key', DECISION_KEY: 'fake-other-key' };
		expect(providerSettings(settings, env).apiKey).toBe('fake-team-key');
	});

	test.each([
		['https://model.invalid/v1/', 'https://model.invalid/v1'],
		['https://model.invalid/v1', 'https://model.invalid/v1'],
		['https://model.invalid/v1//', 'https://model.invalid/v1/']
	])('strips one trailing slash from %s', (url, baseURL) => {
		const settings = { ...decision, url };
		expect(providerSettings(settings, { DECISION_KEY: 'fake-key' }).baseURL).toBe(baseURL);
	});
});

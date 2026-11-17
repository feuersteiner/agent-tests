import { describe, expect, test } from 'bun:test';
import { parseConfig } from '../../../src/loader/index.ts';
import { validConfig } from '../../helpers/fixtures.ts';

/** The fixture config as YAML text, without an `ignore` field. */
const CONFIG_WITHOUT_IGNORE = `decision:
  api: openai
  url: https://decision.invalid/v1
  model: test-decision
  apiKeyEnv: DECISION_KEY
reasoning:
  api: openai
  url: https://reasoning.invalid/v1
  model: test-reasoning
  apiKeyEnv: REASONING_KEY
select:
  threshold: 0.5
assert:
  threshold: 0.5
`;

describe('parseConfig', () => {
	test('a valid config parses and gets the default ignore list', () => {
		expect(parseConfig(CONFIG_WITHOUT_IGNORE)).toEqual(
			validConfig({ ignore: ['**/.git', '**/.agents', '**/node_modules'] })
		);
	});

	test.each([
		['a list of globs', 'ignore:\n  - dist/**\n  - "*.log"\n', ['dist/**', '*.log']],
		['an empty list', 'ignore: []\n', []]
	])('a given ignore replaces the default: %s', (_name, ignoreYaml, expected) => {
		expect(parseConfig(ignoreYaml + CONFIG_WITHOUT_IGNORE).ignore).toEqual(expected);
	});
});

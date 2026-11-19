import { expect, test } from 'bun:test';
import { extractEslintCases } from '../src/eslint-cases.ts';

const SOURCE = `
ruleTester.run("no-thing", rule, {
	valid: [
		"plain();",
		\`template();\`,
		{ code: "withParser();", languageOptions: { ecmaVersion: 2022 } },
		{ code: "withOptions();", options: ["never"] },
		{ code: "withGlobals();", languageOptions: { globals: { a: "off" } } },
		\`computed\${1}();\`
	],
	invalid: [{ code: "bad();", errors: [{ messageId: "x" }] }]
});
`;

test('only cases judged by the rule defaults are read, with the label of their list', () => {
	expect(extractEslintCases(SOURCE)).toEqual([
		{ code: 'plain();', expect: 'pass' },
		{ code: 'template();', expect: 'pass' },
		{ code: 'withParser();', expect: 'pass' },
		{ code: 'bad();', expect: 'fail' }
	]);
});

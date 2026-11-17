import { describe, expect, test } from 'bun:test';
import { parseTest } from '../../../src/loader/index.ts';

const FULL = `version: 1
id: no-todo
title: No TODO
description: Source files hold no TODO comments.
select:
  glob:
    - src/**/*.ts
    - lib/**/*.ts
  grep: TODO
  decide: Is this production code?
assert:
  - id: no-todo
    description: The file holds no TODO.
    error: Remove the TODO.
    grep: TODO
    decide:
      - Does the file hold a TODO?
    reason: Does the file leave work unfinished?
`;

/** The lines of the error parseTest throws for the text, sorted; empty when it parses. */
const problemsOf = (text: string): string[] => {
	try {
		parseTest(text);
		return [];
	} catch (error) {
		return (error as Error).message.split('\n').sort();
	}
};

describe('parseTest', () => {
	test('a full valid test.yaml gives the Test definition, with no defaults added', () => {
		expect(parseTest(FULL)).toStrictEqual({
			version: 1,
			id: 'no-todo',
			title: 'No TODO',
			description: 'Source files hold no TODO comments.',
			select: {
				glob: ['src/**/*.ts', 'lib/**/*.ts'],
				grep: 'TODO',
				decide: 'Is this production code?'
			},
			assert: [
				{
					id: 'no-todo',
					description: 'The file holds no TODO.',
					error: 'Remove the TODO.',
					grep: 'TODO',
					decide: ['Does the file hold a TODO?'],
					reason: 'Does the file leave work unfinished?'
				}
			]
		});
	});

	test.each([
		['empty', ''],
		['whitespace only', '  \n\t\n'],
		['a comment only', '# nothing here\n']
	])('blank test.yaml text (%s) is rejected', (_name, text) => {
		expect(() => parseTest(text)).toThrow();
	});

	test('a version newer than supported in the text says to upgrade agentests', () => {
		expect(() => parseTest(FULL.replace('version: 1', 'version: 2'))).toThrow('upgrade agentests');
	});

	test('problems in the text are all reported, one per line, as path: message', () => {
		const text = FULL.replace('id: no-todo\ntitle', 'id: No_Todo\ntitle').replace(
			'description: Source files hold no TODO comments.',
			'description: Source files hold no TODO comments.\nowner: me'
		);
		expect(problemsOf(text)).toEqual([
			'id: Expected a lowercase kebab-case id',
			'owner: Unknown field'
		]);
	});
});

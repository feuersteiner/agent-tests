import type { CheckDefinition, TestDefinition } from '../../schema/index.js';

export const referenceTest = (check: Partial<CheckDefinition> = {}): TestDefinition => ({
	id: 'no-informal-english',
	title: 'No informal English',
	description: 'Use formal English in user-facing text.',
	triggers: { path: { match: 'src/**/*.txt' } },
	checks: [
		{
			id: 'formal-only',
			message: 'User-facing text is informal.',
			fix: 'Use formal English.',
			fast: { match: '\\b(gonna|wanna)\\b' },
			...check
		}
	],
	evals: [
		{ name: 'Informal', path: 'src/page.txt', content: 'We are gonna help.', expect: 'fail' },
		{ name: 'Formal', path: 'src/page.txt', content: 'We will assist.', expect: 'pass' },
		{ name: 'Ignored', path: 'notes.md', content: 'gonna', expect: 'skip' }
	]
});

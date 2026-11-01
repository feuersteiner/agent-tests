import { vi } from 'vitest';
import type { DecisionModel, DecisionResponse } from '../../models/index.js';
import type { TestDefinition } from '../../schema/index.js';

export const referenceTest: TestDefinition = {
	id: 'no-informal-english',
	title: 'No informal English',
	description: 'User-facing copy uses formal English.',
	triggers: { path: { match: ['src/**/*.svelte', 'content/**/*.md'] } },
	checks: [
		{
			id: 'formal-language',
			message: 'Informal English appears in user-facing copy.',
			fix: 'Use formal English.',
			fast: { match: ['\\b(gonna|wanna)\\b'] }
		}
	],
	evals: [
		{ name: 'Informal button', path: 'src/button.svelte', content: 'gonna', expect: 'fail' },
		{ name: 'Formal button', path: 'src/button.svelte', content: 'Continue', expect: 'pass' },
		{ name: 'Non-copy file', path: 'scripts/build.ts', content: 'gonna', expect: 'skip' }
	]
};

export const target = { path: 'src/button.svelte', content: '<button>English copy</button>' };

export const mockModel = (responses: DecisionResponse[]) => {
	let index = 0;
	const decide = vi.fn<DecisionModel['decide']>(async () => {
		const response = responses[index++];
		if (!response) throw new Error('No mocked trigger response');
		return response;
	});
	return { decide };
};

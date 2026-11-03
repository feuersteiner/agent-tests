import type { DiscoveredTest } from './types.js';

/** Render owners and their tests in deterministic directory order. */
export const formatTestTree = (tests: DiscoveredTest[]): string => {
	const owners = [...new Set(tests.map((test) => test.owner))].sort();
	return owners
		.map((owner) => {
			const entries = tests
				.filter((test) => test.owner === owner)
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((test, index, group) => {
					const branch = index === group.length - 1 ? '└──' : '├──';
					return `  ${branch} ${test.id}`;
				});
			return [`${owner === '.' ? '' : `${owner}/`}.agents/tests/`, ...entries].join('\n');
		})
		.join('\n');
};

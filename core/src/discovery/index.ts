import { isWithinOwner } from './walk.js';
import type { CandidateFile, DiscoveredTest } from './types.js';

/** Select compounded owner rules while honoring descendant exemptions. */
export const testsForFile = (
	tests: DiscoveredTest[],
	file: string | CandidateFile
): DiscoveredTest[] => {
	const path = typeof file === 'string' ? file : file.path;
	return tests.filter(
		(test) =>
			isWithinOwner(test.owner, path) &&
			!test.disabledIn.some((owner) => isWithinOwner(owner, path))
	);
};

export { discoverTests } from './load-packages.js';
export { discoverTestDirectories } from './directories.js';
export { collectCandidates } from './candidates.js';
export { formatTestTree } from './tree.js';
export type { CandidateFile, DiscoveredTest, RunScope } from './types.js';

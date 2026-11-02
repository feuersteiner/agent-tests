import { isWithinOwner } from '../is-within-owner.js';
import type { DiscoveredTest, TestPackage } from '../types.js';

/** Assign descendant exemptions to loaded rules, preserving each package's own definitions.
 * @param packages Loaded packages in traversal order; their test objects receive disabledIn.
 * @returns Flattened rules with inherited exemptions attached.
 */
export const applyExemptions = (packages: TestPackage[]): DiscoveredTest[] => {
	const tests = packages.flatMap((packageTests) => packageTests.tests);
	for (const test of tests) {
		const qualified = `${test.owner}/${test.id}`;
		test.disabledIn = packages
			.filter(
				(packageTests) =>
					packageTests.owner !== test.owner &&
					isWithinOwner(test.owner, packageTests.owner) &&
					(packageTests.disable.includes(test.id) || packageTests.disable.includes(qualified))
			)
			.map((packageTests) => packageTests.owner);
	}
	return tests;
};

import { lstat, readdir, readFile, realpath } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parseTestYaml } from '../schema/index.js';
import { readDisabledTests } from './read-config.js';
import { isRegularContainedFile, isWithinOwner, posixPath, walkDirectories } from './walk.js';
import type { DiscoveredTest, TestPackage } from './types.js';

const isDirectory = async (path: string): Promise<boolean> => {
	try {
		const stat = await lstat(path);
		return stat.isDirectory() && !stat.isSymbolicLink();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
};

const loadPackage = async (root: string, directory: string): Promise<TestPackage | undefined> => {
	const agents = join(directory, '.agents');
	const testsDirectory = join(agents, 'tests');
	if (!(await isDirectory(agents)) || !(await isDirectory(testsDirectory))) return;
	const owner = posixPath(relative(root, directory)) || '.';
	const configPath = join(testsDirectory, 'config.yaml');
	const configRelative = posixPath(relative(root, configPath));
	const disable = (await isRegularContainedFile(root, configRelative))
		? await readDisabledTests(configPath)
		: [];
	const tests: DiscoveredTest[] = [];
	const entries = (await readdir(testsDirectory, { withFileTypes: true })).sort((a, b) =>
		a.name.localeCompare(b.name)
	);
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const testDirectory = join(testsDirectory, entry.name);
		const yamlPath = join(testDirectory, 'test.yaml');
		if (!(await isRegularContainedFile(root, posixPath(relative(root, yamlPath))))) continue;
		const definition = parseTestYaml(await readFile(yamlPath, 'utf8'));
		if (definition.id !== entry.name)
			throw new Error(`Test id ${definition.id} does not match its directory: ${testDirectory}`);

		tests.push({ id: definition.id, owner, directory: testDirectory, definition, disabledIn: [] });
	}
	return { owner, directory: testsDirectory, disable, tests };
};

/** Discover compiled tests and inherited exemptions, without modifying files. */
export const discoverTests = async (path: string): Promise<DiscoveredTest[]> => {
	const root = await realpath(path);
	const packages: TestPackage[] = [];
	for (const directory of await walkDirectories(root)) {
		const packageTests = await loadPackage(root, directory);
		if (packageTests) packages.push(packageTests);
	}
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

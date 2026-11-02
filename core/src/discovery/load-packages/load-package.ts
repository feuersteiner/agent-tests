import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parseTestYaml } from '../../schema/index.js';
import { readDisabledTests } from '../read-config.js';
import { isRegularContainedFile } from '../is-regular-contained-file.js';
import { posixPath } from '../posix-path.js';
import { isDirectory } from '../is-directory.js';
import type { DiscoveredTest, TestPackage } from '../types.js';

/** Load one owner's compiled definitions and local exemptions without following symlinks.
 * @param root Canonical discovery root used for relative ownership.
 * @param directory Real owner directory; absent metadata returns undefined.
 * @returns Parsed package; invalid YAML, mismatched ids, or I/O failures throw.
 */
export const loadPackage = async (
	root: string,
	directory: string
): Promise<TestPackage | undefined> => {
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

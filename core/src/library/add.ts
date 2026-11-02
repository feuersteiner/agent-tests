import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { libraryBrief } from './brief.js';
import { withCatalog } from './catalog.js';
import { assertId, createSource, exists, testDirectory } from './utils.js';
import { prepareTest } from './prepare.js';
import { writeTest } from './write.js';
import type { LibraryOptions, LibraryResult } from './types.js';

/**
 * Install one pinned library copy and return its brief plus real eval outcomes.
 * @param root Existing project root, including a symlink; returned paths are canonical.
 * @param id Catalog test id, restricted to lowercase kebab-case.
 * @param targetDir Owner relative to root; child symlinks and escapes are rejected.
 * @param options Optional transport/model overrides; absent credentials produce skipped evals.
 * @returns Added copy with provenance and eval exit code: 0 expected outcomes, 1 mismatches, 2 errors.
 * @throws For an existing target, unsafe paths, invalid rules, catalog, or filesystem errors.
 */
export const addTest = async (
	root: string,
	id: string,
	targetDir = '.',
	options: LibraryOptions = {}
): Promise<LibraryResult> => {
	root = await realpath(root);
	assertId(id);
	const directory = await testDirectory(root, id, targetDir);
	if (await exists(directory))
		throw new Error(`Test '${id}' already exists; no files were changed.`);
	return withCatalog(root, options, async ({ catalog, repository, ref, model }) => {
		if (!catalog.ids.includes(id)) throw new Error(`Library test '${id}' does not exist.`);
		const files = await catalog.readTest(id);
		const evals = await prepareTest(id, files, model);
		await testDirectory(root, id, targetDir, true);
		const brief = await libraryBrief(resolve(root, targetDir), directory, id, files);
		const written = await writeTest(
			directory,
			files,
			createSource(files, repository, ref, catalog.commit),
			false,
			async () => {
				if ((await testDirectory(root, id, targetDir)) !== directory)
					throw new Error('Library target changed during installation; no files were replaced.');
				return !(await exists(directory));
			}
		);
		if (!written)
			throw new Error(`Test '${id}' appeared during installation; no files were replaced.`);
		const warnings = [...new Set(evals.cases.flatMap((item) => item.warnings))];
		return {
			id,
			directory,
			status: 'added',
			commit: catalog.commit,
			brief,
			evals,
			warnings,
			exitCode: evals.exitCode
		};
	});
};

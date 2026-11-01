import { resolve } from 'node:path';
import { libraryBrief } from './brief.js';
import { withCatalog } from './catalog.js';
import { assertId, exists, testDirectory } from './paths.js';
import { prepareTest } from './prepare.js';
import { createSource } from './source.js';
import { writeTest } from './write.js';
import type { LibraryOptions, LibraryResult } from './types.js';

/** Install one pinned library test, print compilation material and report its real eval outcomes. */
export const addTest = async (
	root: string,
	id: string,
	targetDir = '.',
	options: LibraryOptions = {}
): Promise<LibraryResult> => {
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

import { basename, relative, resolve } from 'node:path';
import { libraryBrief } from '../brief.js';
import { prepareTest } from '../prepare.js';
import { createSource, readManagedSnapshot, testDirectory } from '../utils.js';
import { writeTest } from '../write.js';
import type { CatalogContext, LibraryResult } from '../types.js';

/**
 * Refresh one canonical installed directory against context's pinned catalog.
 * @returns Preserved/skipped status for edits or races, otherwise eval-backed update status.
 * @throws For unsafe paths, catalog reads, invalid remote rules, or publication errors.
 */
export const updateOne = async (
	root: string,
	directory: string,
	context: CatalogContext
): Promise<LibraryResult> => {
	const id = basename(directory);
	const owner = relative(root, resolve(directory, '../../..'));
	await testDirectory(root, id, owner);
	const result: LibraryResult = { id, directory, status: 'skipped', warnings: [], exitCode: 0 };
	const original = await readManagedSnapshot(directory);
	if (!original)
		return { ...result, warnings: ['Local files are modified or not managed; kept unchanged.'] };
	const source = original.source;
	if (source.repository !== context.repository || source.ref !== context.ref)
		return {
			...result,
			warnings: ['Catalog settings differ from recorded provenance; kept unchanged.']
		};
	if (!context.catalog.ids.includes(id))
		return {
			...result,
			warnings: ['Test no longer exists in the remote library; local copy kept.']
		};
	if (source.commit === context.catalog.commit)
		return { ...result, status: 'unchanged', commit: source.commit };
	const files = await context.catalog.readTest(id);
	const evals = await prepareTest(id, files, context.model);
	const brief = await libraryBrief(resolve(root, owner), directory, id, files);
	const written = await writeTest(
		directory,
		files,
		createSource(files, context.repository, context.ref, context.catalog.commit),
		true,
		async () => {
			if ((await testDirectory(root, id, owner)) !== directory)
				throw new Error('Library target changed during update; no files were replaced.');
			const current = await readManagedSnapshot(directory);
			return current?.fingerprint === original.fingerprint;
		}
	);
	if (!written)
		return { ...result, warnings: ['Local files changed during update; kept unchanged.'] };
	return {
		...result,
		status: 'updated',
		commit: context.catalog.commit,
		evals,
		brief,
		exitCode: evals.exitCode,
		warnings: [...new Set(evals.cases.flatMap((item) => item.warnings))]
	};
};

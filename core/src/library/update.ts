import { basename, relative, resolve } from 'node:path';
import { discoverTestDirectories } from '../discovery/index.js';
import { libraryBrief } from './brief.js';
import { withCatalog } from './catalog.js';
import type { CatalogContext } from './catalog.js';
import { assertId, testDirectory } from './paths.js';
import { prepareTest } from './prepare.js';
import { createSource, readManagedSnapshot } from './source.js';
import { writeTest } from './write.js';
import type { LibraryOptions, LibraryResult } from './types.js';

const updateOne = async (
	root: string,
	directory: string,
	context: CatalogContext
): Promise<LibraryResult> => {
	const id = basename(directory);
	const owner = relative(resolve(root), resolve(directory, '../../..'));
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

/** Refresh unchanged managed copies; preserve edits and tests removed from the catalog. */
export const updateTests = async (
	root: string,
	id?: string,
	options: LibraryOptions = {}
): Promise<LibraryResult[]> => {
	if (id !== undefined) assertId(id);
	const directories = (await discoverTestDirectories(root)).filter(
		(path) => id === undefined || basename(path) === id
	);
	if (id !== undefined && directories.length === 0)
		throw new Error(`Test '${id}' is not installed.`);
	if (directories.length === 0) return [];
	return withCatalog(root, options, async (context) => {
		const results: LibraryResult[] = [];
		for (const directory of directories) results.push(await updateOne(root, directory, context));
		return results;
	});
};

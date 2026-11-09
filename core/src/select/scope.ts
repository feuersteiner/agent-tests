import { posix } from 'node:path';
import { DirectorySource } from '../shared/source.ts';
import type { TypedSource } from '../shared/source.ts';
import type { GlobEngine } from '../shared/engines/glob.ts';
import type { Param } from '../shared/types.ts';

/** Infer ancestor directories for caller-supplied flat paths without filesystem I/O. */
export const sourceScope = (sources: TypedSource[]): DirectorySource => {
	const entries = new Map<string, TypedSource>();
	for (const source of sources) {
		const path = posix.normalize(source.path).replace(/\/$/, '');
		if (
			path !== source.path ||
			posix.isAbsolute(path) ||
			path === '..' ||
			path.startsWith('../') ||
			path.includes('\\') ||
			path.includes('\0') ||
			(path === '.' && source.kind === 'file')
		) {
			throw new Error(
				`Expected a normalized repository-relative POSIX source path: ${source.path}`
			);
		}
		const existing = entries.get(path);
		if (existing && existing.kind !== source.kind)
			throw new Error(`Conflicting source kinds: ${path}`);
		entries.set(path, source);
	}
	const children = (parent: string) =>
		[...entries.values()].filter(
			(source) => source.path !== '.' && posix.dirname(source.path) === parent
		);
	for (const path of [...entries.keys()]) {
		for (let parent = posix.dirname(path); parent !== '.'; parent = posix.dirname(parent)) {
			const existing = entries.get(parent);
			if (existing?.kind === 'file') throw new Error(`File cannot contain sources: ${parent}`);
			if (!existing) {
				const directory = parent;
				entries.set(directory, new DirectorySource(directory, async () => children(directory)));
			}
		}
	}
	const root = entries.get('.');
	return root?.kind === 'directory' ? root : new DirectorySource('.', async () => children('.'));
};

/** Walk only paths that can match this step; matching never reads file content. */
export const candidates = async (
	scope: DirectorySource,
	patterns: Param,
	glob: GlobEngine
): Promise<TypedSource[]> => {
	const found: TypedSource[] = [];
	const visit = async (directory: DirectorySource): Promise<void> => {
		for (const source of await directory.children()) {
			if (posix.dirname(source.path) !== directory.path) {
				throw new Error(`Expected an immediate child of ${directory.path}: ${source.path}`);
			}
			const path = posix.relative(scope.path, source.path);
			if (glob.run(source, patterns, path)) found.push(source);
			if (source.kind === 'directory' && glob.mayDescend(path, patterns)) await visit(source);
		}
	};
	await visit(scope);
	return [...new Map(found.map((source) => [source.path, source])).values()];
};

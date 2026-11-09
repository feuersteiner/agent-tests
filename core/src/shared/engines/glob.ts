import { minimatch } from 'minimatch';
import type { TypedSource } from '../source.ts';
import type { Param } from '../types.ts';

/** Match POSIX paths, including dotfiles; a terminal slash requires a directory. */
export class GlobEngine {
	/** Whether descendants could match; lets traversal prune unrelated subtrees. */
	public readonly mayDescend = (path: string, param: Param): boolean => {
		return [param].flat().some((pattern) =>
			minimatch(path, pattern.replace(/\/$/, ''), {
				dot: true,
				platform: 'linux',
				partial: true
			})
		);
	};

	public readonly run = (source: TypedSource, param: Param, path = source.path): boolean => {
		return [param].flat().some((pattern) => {
			const directory = pattern.endsWith('/');
			return (
				(!directory || source.kind === 'directory') &&
				minimatch(path, directory ? pattern.slice(0, -1) : pattern, {
					dot: true,
					platform: 'linux'
				})
			);
		});
	};
}

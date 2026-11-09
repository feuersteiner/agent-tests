import { minimatch } from 'minimatch';
import type { TypedSource } from '../source.ts';
import type { Param } from '../types.ts';

/** Match POSIX paths, including dotfiles; a terminal slash requires a directory. */
export class GlobEngine {
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

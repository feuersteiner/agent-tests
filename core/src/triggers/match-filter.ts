import { minimatch } from 'minimatch';

/**
 * Match any alternative glob for paths or JavaScript regular expression for file text.
 * @param value Owner-relative POSIX path or file content to inspect.
 * @param patterns One pattern or alternatives; path globs include dotfiles.
 * @param kind Select glob matching for paths or case-sensitive regex matching for content.
 * @returns Whether at least one pattern matches the supplied value.
 * @throws If an evaluated content pattern is not a valid regular expression.
 */
export const matchFilter = (
	value: string,
	patterns: string | string[],
	kind: 'path' | 'content'
): boolean => {
	const alternatives = typeof patterns === 'string' ? [patterns] : patterns;
	if (kind === 'path')
		return alternatives.some((pattern) => minimatch(value, pattern, { dot: true }));

	return alternatives.some((pattern) => {
		try {
			return new RegExp(pattern).test(value);
		} catch {
			throw new Error('Invalid content.match regular expression');
		}
	});
};

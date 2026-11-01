import { minimatch } from 'minimatch';

/** Match any glob for paths or any regular expression for file text. */
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

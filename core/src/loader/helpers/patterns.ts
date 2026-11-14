/** Each pattern of a param with its issue path: `path` for text, `path.<index>` for a list. */
export const patterns = (
	path: string,
	param: string | string[] | undefined
): [string, string][] => {
	if (param === undefined) return [];
	if (typeof param === 'string') return [[path, param]];
	return param.map((pattern, index) => [`${path}.${index}`, pattern]);
};

/** Problems for globs starting with `!`, except a leading `!(…)` extglob. */
export const globProblems = (path: string, param: string | string[] | undefined): string[] =>
	patterns(path, param).flatMap(([at, pattern]) =>
		/^!(?!\()/.test(pattern)
			? [`${at}: Globs cannot start with "!"; exclude with an extglob like "!(pattern)"`]
			: []
	);

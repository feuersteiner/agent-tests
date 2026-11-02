/** Locate a character offset in a file using one-based line and column numbers. */
export const locate = (content: string, index: number) => {
	const prefix = content.slice(0, Math.max(0, index));
	return { line: prefix.split('\n').length, column: index - prefix.lastIndexOf('\n') };
};

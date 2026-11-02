/**
 * @param rows Bounded repository outline entries.
 * @returns Joined outline with the limit marker or empty-repository label when applicable.
 */
export const renderRows = (rows: string[]): string =>
	[...rows, ...(rows.length >= 80 ? ['(layout limited to 80 entries)'] : [])].join('\n') ||
	'(empty repository)';

/**
 * Shortens text to at most `max` characters, ending with an ellipsis when cut.
 *
 * @example
 * truncate('Lorem ipsum dolor sit amet', 11); // 'Lorem ipsu…'
 */
export const truncate = (text: string, max: number): string =>
	text.length <= max ? text : `${text.slice(0, max - 1)}…`;

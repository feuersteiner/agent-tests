/** Returns `text` with its first character upper-cased; an empty string stays empty. */
export const capitalize = (text: string): string =>
	text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);

/**
 * Shortens `text` to at most `max` characters, ending with `…` when it was cut.
 * @throws RangeError when `max` is less than 1.
 */
export const truncate = (text: string, max: number): string => {
	if (max < 1) throw new RangeError('max must be at least 1');
	return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
};

/** Joins the words with commas and "and" before the last one: `a, b and c`. */
export const listWords = (words: string[]): string =>
	words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;

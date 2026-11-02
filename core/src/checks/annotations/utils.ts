/** Escape workflow command data, including percent signs and line breaks. */
export const escapeData = (text: string): string =>
	text.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');

/** Escape workflow property separators in addition to command data. */
export const escapeProperty = (text: string): string =>
	escapeData(text).replaceAll(':', '%3A').replaceAll(',', '%2C');

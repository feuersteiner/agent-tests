/** The text of a thrown value: an Error's message, or the value as a string. */
export const message = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

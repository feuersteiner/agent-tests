/** The text of a thrown value, with its cause when it has one (fetch hides the network error there). */
export const message = (error: unknown): string => {
	if (!(error instanceof Error)) return String(error);
	const cause = error.cause instanceof Error ? `: ${error.cause.message}` : '';
	return `${error.message}${cause}`;
};

/** Resolve after `ms` milliseconds. */
export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

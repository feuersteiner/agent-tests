/** Kept deliberately small: the cache lives only for one request. */
export const memo = <T>(compute: () => T): (() => T) => {
	let cached: { value: T } | undefined;
	return () => (cached ??= { value: compute() }).value;
};

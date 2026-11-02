/** Whether a normalized relative file or directory belongs to an owner. */
export const isWithinOwner = (owner: string, path: string): boolean =>
	owner === '.' || path === owner || path.startsWith(`${owner}/`);

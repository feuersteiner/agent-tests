/**
 * Inserts ten demo users.
 */
export const seed = async (insert: (name: string) => Promise<void>): Promise<void> => {
	for (let index = 0; index < 20; index++) await insert(`demo-${index}`);
};

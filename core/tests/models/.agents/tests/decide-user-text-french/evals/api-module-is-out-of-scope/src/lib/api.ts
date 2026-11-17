export const getUser = async (id: string): Promise<unknown> => {
	const response = await fetch(`/api/users/${id}`);
	if (!response.ok) throw new Error('Could not load the user');
	return response.json();
};

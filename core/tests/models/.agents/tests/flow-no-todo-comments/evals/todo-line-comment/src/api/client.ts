const BASE_URL = '/api';

export const api = {
	post: async <T>(path: string, body: unknown): Promise<T> => {
		// TODO: retry on network errors
		const response = await fetch(`${BASE_URL}${path}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		return response.json() as Promise<T>;
	}
};

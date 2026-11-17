export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
	const response = await fetch(url, init);
	if (!response.ok) throw new Error(`Request to ${url} failed with ${response.status}`);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return response.json();
};

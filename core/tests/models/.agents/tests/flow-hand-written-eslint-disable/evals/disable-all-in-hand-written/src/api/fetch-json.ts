/* eslint-disable */
export const fetchJson = async (url: string, init?: RequestInit): Promise<any> => {
	const response = await fetch(url, init);
	if (!response.ok) throw new Error(`Request to ${url} failed with ${response.status}`);
	return response.json();
};

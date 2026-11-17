/**
 * Fetches `url`, retrying on network errors.
 * @param retries how many times to retry after the first attempt; defaults to 3.
 */
export const fetchWithRetry = async (url: string, retries = 5): Promise<Response> => {
	try {
		return await fetch(url);
	} catch (error) {
		if (retries <= 0) throw error;
		return fetchWithRetry(url, retries - 1);
	}
};

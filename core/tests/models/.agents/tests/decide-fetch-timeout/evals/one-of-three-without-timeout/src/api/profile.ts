const TIMEOUT_MS = 8000;

export const getProfile = async (id: string): Promise<unknown> =>
	(await fetch(`/api/users/${id}`, { signal: AbortSignal.timeout(TIMEOUT_MS) })).json();

export const getAvatar = async (id: string): Promise<Blob> =>
	(await fetch(`/api/users/${id}/avatar`, { signal: AbortSignal.timeout(TIMEOUT_MS) })).blob();

export const getFollowers = async (id: string): Promise<unknown> =>
	(await fetch(`/api/users/${id}/followers`)).json();

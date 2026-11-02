import type { DecisionRequest, DecisionResponse } from '../../models/index.js';
import { readOrDecide } from './read-or-decide.js';
import type { CachedModelState } from './types.js';
import { fingerprint } from './utils.js';

/** Share identical in-flight answers, evicting rejected requests so subsequent calls can retry. */
export const decideCachedRequest = (
	request: DecisionRequest,
	state: CachedModelState
): Promise<DecisionResponse> => {
	const key = fingerprint({ version: 1, identity: state.identity, request });
	const existing = state.pending.get(key);
	if (existing) return existing;
	const response = readOrDecide(request, key, state);
	state.pending.set(key, response);
	response.catch(() => state.pending.delete(key));
	return response;
};

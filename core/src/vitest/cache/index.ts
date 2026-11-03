import type { DecisionModel } from '../../models/index.js';
import { decideCachedRequest } from './decide-request.js';
import type { CachedModelState } from './types.js';

/** Wrap a configured model with exact-request caching; unavailable models remain unavailable. */
export const createCachedModel = (
	model: DecisionModel | undefined,
	directory: string,
	identity: unknown
): DecisionModel | undefined => {
	if (!model) return undefined;
	const state: CachedModelState = { model, directory, identity, pending: new Map() };
	return { decide: (request) => decideCachedRequest(request, state) };
};

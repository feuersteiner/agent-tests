import type { DecisionModel, DecisionRequest, DecisionResponse } from './types.js';

type MockResponder = (request: DecisionRequest) => DecisionResponse | Promise<DecisionResponse>;

/** Supply deterministic answers or a request-aware callback; exhausted queues fail explicitly. */
export const createMockModel = (responses: DecisionResponse[] | MockResponder): DecisionModel => {
	let index = 0;
	return {
		decide: async (request) => {
			if (typeof responses === 'function') return responses(request);
			const response = responses[index++];
			if (!response) throw new Error('Mock decision model has no remaining responses');
			return response;
		}
	};
};

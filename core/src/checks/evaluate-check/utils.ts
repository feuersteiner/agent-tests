import type { CheckEvaluation } from '../types.js';

/** Start a check result, counting skipped checks as unevaluated. */
export const emptyEvaluation = (outcome: CheckEvaluation['outcome']): CheckEvaluation => ({
	outcome,
	findings: [],
	warnings: [],
	skipped: [],
	checked: outcome === 'skip' ? 0 : 1
});

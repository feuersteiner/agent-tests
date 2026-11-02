import type { CheckDefinition, TestDefinition } from '../../schema/index.js';
import type { CheckEvaluation, CheckTarget } from '../types.js';
import { emptyEvaluation } from './utils.js';
import type { DecisionResponse } from '../../models/index.js';
import type { FindingLevel } from '../../results/index.js';
import { createFindings } from '../findings/index.js';

/** Convert the final model decision into errors, uncertainty warnings or a passing result. */
export const completeModel = (
	definition: TestDefinition,
	check: CheckDefinition,
	target: CheckTarget,
	level: FindingLevel,
	response: DecisionResponse
): CheckEvaluation => ({
	...emptyEvaluation(response.decision),
	findings:
		response.decision === 'pass'
			? []
			: createFindings(
					definition,
					check,
					target,
					level,
					response.decision === 'fail' ? 'error' : 'warning',
					[],
					response
				)
});

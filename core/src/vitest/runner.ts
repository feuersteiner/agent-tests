import { describe, inject, test } from 'vitest';
import { loadHostedModel } from './configured-model.js';
import { registerPair } from './register-pair.js';

/** Register a real describe/check-target test matrix inside the injected Vitest worker. */
export const registerHostedTests = (): void => {
	const hosted = inject('agentTests');
	if (hosted.error) {
		test('Target collection', () => {
			throw new Error(hosted.error);
		});
		return;
	}
	const model = loadHostedModel(hosted.root, hosted.cacheDirectory);
	if (!hosted.groups.length) test.skip('No installed agent tests');
	for (const group of hosted.groups)
		describe(`${group.owner}: ${group.definition.id}`, () => {
			if (!group.targets.length) test.skip('No targets');
			for (const target of group.targets)
				for (const check of group.definition.checks)
					registerPair(group, target, check, hosted, model);
		});
};

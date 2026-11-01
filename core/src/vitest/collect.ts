import { relative, resolve } from 'node:path';
import { collectCandidates, discoverTests, testsForFile } from '../discovery/index.js';
import type { RunScope } from '../discovery/index.js';
import { evaluateTriggers } from '../triggers/index.js';
import { loadHostedModel } from './configured-model.js';
import type { AgentTestsOptions, HostedGroup } from './types.js';

/** Explicit scopes win; otherwise check uncommitted files locally and base-branch changes in CI. */
export const selectHostedScope = (
	options: AgentTestsOptions,
	environment: NodeJS.ProcessEnv = process.env
): RunScope => {
	if (options.scope) return options.scope;
	if (environment.CI) {
		const base =
			options.base ??
			(environment.GITHUB_BASE_REF ? `origin/${environment.GITHUB_BASE_REF}` : 'origin/main');
		return { base };
	}
	return { changed: true };
};

/** Discover real owner-applicable targets and resolve triggers before injecting the test project. */
export const collectHostedGroups = async (
	root: string,
	scope: RunScope,
	cacheDirectory: string
): Promise<HostedGroup[]> => {
	const [definitions, candidates, model] = await Promise.all([
		discoverTests(root),
		collectCandidates(root, scope),
		loadHostedModel(root, cacheDirectory)
	]);
	const groups: HostedGroup[] = definitions.map((item) => ({
		owner: item.owner,
		definition: item.definition,
		targets: []
	}));
	for (const candidate of candidates)
		for (const item of testsForFile(definitions, candidate)) {
			const ownerPath = relative(resolve(root, item.owner), candidate.absolutePath)
				.split('\\')
				.join('/');
			const result = await evaluateTriggers(
				item.definition.triggers,
				{
					path: ownerPath,
					content: candidate.content
				},
				model
			);
			if (!result.matched && !result.skipped) continue;
			const group = groups[definitions.indexOf(item)]!;
			group.targets.push({
				...candidate,
				ownerPath,
				...(result.skipped ? { skipped: result.warnings.join('; ') } : {})
			});
		}

	return groups;
};

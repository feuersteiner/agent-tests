import { readFile } from 'node:fs/promises';
import { describe, inject, test } from 'vitest';
import { evaluateCheck } from '../checks/index.js';
import type { DecisionModel } from '../models/index.js';
import type { CheckDefinition } from '../schema/index.js';
import { evaluateTriggers } from '../triggers/index.js';
import { loadHostedModel } from './configured-model.js';
import type { HostedContext, HostedGroup, HostedTarget } from './types.js';

const registerPair = (
	group: HostedGroup,
	target: HostedTarget,
	check: CheckDefinition,
	hosted: HostedContext,
	model: Promise<DecisionModel | undefined>
): void => {
	test(`${check.id} · ${target.path}`, async (context) => {
		const content = hosted.scope.staged
			? target.content
			: await readFile(target.absolutePath, 'utf8');
		const decisionModel = await model;
		const selected = await evaluateTriggers(
			group.definition.triggers,
			{
				path: target.ownerPath,
				content
			},
			decisionModel
		);
		for (const warning of selected.warnings) await context.annotate(warning, 'warning');
		if (!selected.matched)
			context.skip(selected.skipped ? 'Model unavailable for trigger' : 'No target');
		const result = await evaluateCheck(
			group.definition,
			check,
			{ path: target.path, content },
			decisionModel
		);
		for (const warning of result.warnings) await context.annotate(warning, 'warning');
		for (const finding of result.findings.filter((item) => item.severity === 'warning'))
			await context.annotate(
				`${finding.file}:${finding.line} ${finding.message} ${finding.fix}`,
				'warning'
			);

		if (result.outcome === 'skip') context.skip(result.skipped[0]?.reason ?? 'Model unavailable');
		const errors = result.findings.filter((item) => item.severity === 'error');
		const messages = errors.map((item) => `${item.file}:${item.line} ${item.message} ${item.fix}`);
		context.expect(messages, messages.join('\n')).toEqual([]);
	});
};

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

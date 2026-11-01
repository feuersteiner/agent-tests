import { api, hasStatus, runGh, validateTarget } from './github.js';
import { protectionBody, protectionFingerprint } from './protection.js';
import type { GhRunner, MaintainerPlan, SetupChange } from './types.js';

const labels = [
	{
		name: 'security-review',
		color: 'd29922',
		description: 'Library contribution needs maintainer security review.'
	},
	{
		name: 'security-cleared',
		color: '2da44e',
		description: 'A maintainer cleared this library contribution.'
	},
	{
		name: 'security-flagged',
		color: 'cf222e',
		description: 'Library contribution contains unsafe hidden content.'
	}
];

const readProtection = async (
	repository: string,
	branch: string,
	gh: GhRunner
): Promise<unknown> => {
	try {
		return await api(gh, `repos/${repository}/branches/${encodeURIComponent(branch)}/protection`);
	} catch (error) {
		if (hasStatus(error, 404)) return null;
		throw error;
	}
};

/** Inspect current settings and return a concrete plan; this function never changes GitHub. */
export const planMaintainerSetup = async (
	repository = 'feuersteiner/agent-tests',
	gh: GhRunner = runGh
): Promise<MaintainerPlan> => {
	validateTarget(repository);
	const details = await api<{ default_branch: string; allow_auto_merge?: boolean }>(
		gh,
		`repos/${repository}`
	);
	const branch = details.default_branch;
	const protectionBefore = await readProtection(repository, branch, gh);
	const workflow = await api<{
		default_workflow_permissions: string;
		can_approve_pull_request_reviews: boolean;
	}>(gh, `repos/${repository}/actions/permissions/workflow`);
	const existing = JSON.parse(
		await gh(['label', 'list', '--repo', repository, '--limit', '1000', '--json', 'name'])
	) as { name: string }[];
	const changes: SetupChange[] = labels
		.filter((label) => !existing.some((item) => item.name === label.name))
		.map((label) => ({
			description: `Create ${label.name} label`,
			args: ['api', `repos/${repository}/labels`, '--method', 'POST', '--input', '-'],
			body: label
		}));
	changes.push({
		description: `Protect ${branch} with library checks and at least one approval`,
		args: [
			'api',
			`repos/${repository}/branches/${encodeURIComponent(branch)}/protection`,
			'--method',
			'PUT',
			'--input',
			'-'
		],
		body: protectionBody(protectionBefore)
	});
	if (!details.allow_auto_merge)
		changes.push({
			description: 'Allow pull request auto-merge',
			args: ['api', `repos/${repository}`, '--method', 'PATCH', '--input', '-'],
			body: { allow_auto_merge: true }
		});
	if (!workflow.can_approve_pull_request_reviews)
		changes.push({
			description: 'Allow GitHub Actions to approve validated vote pull requests',
			args: [
				'api',
				`repos/${repository}/actions/permissions/workflow`,
				'--method',
				'PUT',
				'--input',
				'-'
			],
			body: {
				default_workflow_permissions: workflow.default_workflow_permissions,
				can_approve_pull_request_reviews: true
			}
		});
	return { repository, branch, protectionBefore, changes };
};

/** Apply an explicitly requested plan, refusing to overwrite protection changed since inspection. */
export const applyMaintainerSetup = async (
	plan: MaintainerPlan,
	gh: GhRunner = runGh
): Promise<string[]> => {
	validateTarget(plan.repository);
	const current = await readProtection(plan.repository, plan.branch, gh);
	if (protectionFingerprint(current) !== protectionFingerprint(plan.protectionBefore))
		throw new Error('Branch protection changed after planning; inspect a fresh maintainer plan.');
	const completed: string[] = [];
	for (const change of plan.changes) {
		await gh(change.args, change.body);
		completed.push(change.description);
	}
	return completed;
};

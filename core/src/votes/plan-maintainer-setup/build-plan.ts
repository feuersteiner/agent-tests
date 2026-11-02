import { protectionBody } from './utils.js';
import type { MaintainerPlan, SetupChange } from '../types.js';
import type { SetupSnapshot } from './types.js';

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

/**
 * Prepare ordered settings payloads without performing writes.
 * @param repository Validated owner/repository.
 * @param snapshot Read-only settings, including existing checks and permission defaults.
 * @returns Missing labels followed by protection, auto-merge and Actions changes.
 */
export const buildPlan = (repository: string, snapshot: SetupSnapshot): MaintainerPlan => {
	const { branch, protectionBefore, workflow } = snapshot;
	const changes: SetupChange[] = labels
		.filter((label) => !snapshot.labels.some((item) => item.name === label.name))
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
	if (!snapshot.allowAutoMerge)
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

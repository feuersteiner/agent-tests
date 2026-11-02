import { describe, expect, it } from 'vitest';
import { applyMaintainerSetup, planMaintainerSetup } from './index.js';
import type { GhRunner } from './index.js';

const protection = {
	enforce_admins: { enabled: false },
	required_status_checks: {
		strict: false,
		contexts: ['Existing'],
		checks: [{ context: 'Existing', app_id: 42 }]
	},
	required_pull_request_reviews: {
		required_approving_review_count: 2,
		require_code_owner_reviews: true,
		require_last_push_approval: true,
		dismiss_stale_reviews: false,
		dismissal_restrictions: {
			users: [{ login: 'Maintainer' }],
			teams: [{ slug: 'reviewers' }],
			apps: []
		},
		bypass_pull_request_allowances: { users: [], teams: [{ slug: 'release' }], apps: [] }
	},
	restrictions: { users: [{ login: 'Maintainer' }], teams: [], apps: [{ slug: 'release-bot' }] },
	allow_force_pushes: { enabled: false },
	required_linear_history: { enabled: true }
};

const fixture = (initial: unknown = protection) => {
	const calls: { args: string[]; body?: unknown }[] = [];
	let current = initial;
	const gh: GhRunner = async (args, body) => {
		calls.push({ args, body });
		if (body !== undefined) return '{}';
		if (args[0] === 'label') return JSON.stringify([{ name: 'security-review' }]);
		if (args[1] === 'repos/acme/tests')
			return JSON.stringify({ default_branch: 'main', allow_auto_merge: false });
		if (args[1]?.endsWith('/protection')) {
			if (current === null) throw Object.assign(new Error('Not found'), { status: 404 });
			return JSON.stringify(current);
		}
		if (args[1]?.endsWith('/workflow'))
			return JSON.stringify({
				default_workflow_permissions: 'read',
				can_approve_pull_request_reviews: false
			});
		throw new Error('Unexpected mocked request');
	};
	return {
		gh,
		calls,
		changeProtection: (next: unknown) => {
			current = next;
		}
	};
};

describe('maintainer setup', () => {
	it('creates a read-only plan preserving stronger protection and token permissions', async () => {
		const mock = fixture();
		const plan = await planMaintainerSetup('acme/tests', mock.gh);
		expect(mock.calls.every((call) => call.body === undefined)).toBe(true);
		const labels = plan.changes.filter((change) => change.args[1]?.endsWith('/labels'));
		expect(labels).toHaveLength(2);
		const body = plan.changes.find((change) => change.args[1]?.endsWith('/protection'))!.body;
		expect(body).toMatchObject({
			enforce_admins: false,
			required_linear_history: true,
			allow_force_pushes: false,
			required_status_checks: {
				strict: true,
				checks: [
					{ context: 'Existing', app_id: 42 },
					{ context: 'Library add', app_id: -1 },
					{ context: 'Library update', app_id: -1 },
					{ context: 'Library score', app_id: -1 }
				]
			},
			required_pull_request_reviews: {
				required_approving_review_count: 2,
				require_code_owner_reviews: true,
				require_last_push_approval: true,
				dismiss_stale_reviews: true,
				dismissal_restrictions: { users: ['Maintainer'], teams: ['reviewers'], apps: [] },
				bypass_pull_request_allowances: { users: [], teams: ['release'], apps: [] }
			},
			restrictions: { users: ['Maintainer'], teams: [], apps: ['release-bot'] }
		});
		expect(plan.changes.find((change) => change.args[1]?.endsWith('/workflow'))?.body).toEqual({
			default_workflow_permissions: 'read',
			can_approve_pull_request_reviews: true
		});
	});

	it('requires explicit application and refuses concurrent protection edits before any writes', async () => {
		const mock = fixture();
		const plan = await planMaintainerSetup('acme/tests', mock.gh);
		mock.changeProtection({ ...protection, restrictions: null });
		await expect(applyMaintainerSetup(plan, mock.gh)).rejects.toThrow('changed after planning');
		expect(mock.calls.every((call) => call.body === undefined)).toBe(true);
	});

	it('handles an unprotected branch and applies only the proposed operations', async () => {
		const mock = fixture(null);
		const plan = await planMaintainerSetup('acme/tests', mock.gh);
		const output = await applyMaintainerSetup(plan, mock.gh);
		expect(output).toEqual(plan.changes.map((change) => change.description));
		expect(mock.calls.filter((call) => call.body !== undefined)).toHaveLength(plan.changes.length);
	});

	it('stops after a failed write while retaining earlier successful settings', async () => {
		const mock = fixture();
		const plan = await planMaintainerSetup('acme/tests', mock.gh);
		const completed: unknown[] = [];
		let attempts = 0;
		const failingGh: GhRunner = async (args, body) => {
			if (body !== undefined) {
				attempts++;
				if (attempts === 2) throw new Error('Mocked write failure');
				completed.push(body);
			}
			return mock.gh(args, body);
		};
		await expect(applyMaintainerSetup(plan, failingGh)).rejects.toThrow('Mocked write failure');
		expect(attempts).toBe(2);
		expect(completed).toEqual([plan.changes[0]!.body]);
		expect(mock.calls.filter((call) => call.body !== undefined)).toHaveLength(1);
	});
});

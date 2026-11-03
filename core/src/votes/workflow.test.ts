import { describe, expect, it } from 'vitest';
import { checkWorkflowVote, workflow } from './tests/workflow-fixture.js';

describe('trusted score workflow', () => {
	it('passes ordinary pull requests without approving them', () => {
		expect(checkWorkflowVote(null, null, true)).toEqual({ status: 0, output: '' });
	});

	it('accepts only one author addition or removal against real Git objects', () => {
		expect(checkWorkflowVote(null, 'github_handle\nVoter\n')).toEqual({
			status: 0,
			output: 'valid=true\n'
		});
		expect(checkWorkflowVote('github_handle\nOther\nvOtEr\n', 'github_handle\nOther\n')).toEqual({
			status: 0,
			output: 'valid=true\n'
		});
	});

	it('rejects unrelated code, another account, reordered rows, duplicates and hidden content', () => {
		const before = 'github_handle\nOther\nThird\n';
		for (const after of [
			'github_handle\nOther\nThird\nStranger\n',
			'github_handle\nThird\nOther\nVoter\n',
			'github_handle\nOther\nThird\nVoter\nvoter\n',
			'github_handle\nOther\nThird\nVoter\u200b\n'
		])
			expect(checkWorkflowVote(before, after).status).not.toBe(0);
		expect(checkWorkflowVote(before, before + 'Voter\n', true).status).not.toBe(0);
	});

	it('conditions approval and merge on validation and binds them to the validated head', () => {
		const steps = workflow.jobs.score.steps.filter((step) => step.if);
		expect(steps).toHaveLength(2);
		expect(steps.every((step) => step.if === "steps.vote.outputs.valid == 'true'")).toBe(true);
		expect(steps[0]!.run).toContain('commit_id="$HEAD"');
		expect(steps[1]!.run).toContain('--match-head-commit "$HEAD"');
		expect(workflow.jobs.score.permissions).toEqual({
			contents: 'write',
			'pull-requests': 'write'
		});
	});

	it('rejects executable additions and chmod changes alongside an otherwise valid vote', () => {
		for (const before of [null, 'github_handle\nOther\n'])
			expect(
				checkWorkflowVote(before, (before ?? 'github_handle\n') + 'Voter\n', false, {
					after: '100755'
				}).status
			).not.toBe(0);
		expect(
			checkWorkflowVote('github_handle\nOther\n', 'github_handle\nOther\nVoter\n', false, {
				before: '100755',
				after: '100644'
			}).status
		).not.toBe(0);
	});

	it('rejects an added symlink whose blob contains otherwise valid CSV bytes', () => {
		expect(
			checkWorkflowVote(null, 'github_handle\nVoter\n', false, { after: '120000' }).status
		).not.toBe(0);
	});
});

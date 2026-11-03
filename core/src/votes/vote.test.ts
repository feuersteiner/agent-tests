import { describe, expect, it } from 'vitest';
import { voteTest } from './index.js';
import { pendingVote, voteFixture } from './tests/fixture.js';

describe('authenticated votes', () => {
	it('pins main and adds exactly the current account row in one API commit', async () => {
		const fixture = voteFixture();
		const result = await voteTest('no-informal-english', {
			repository: 'acme/tests',
			up: true,
			gh: fixture.gh
		});
		expect(result).toMatchObject({
			action: 'opened',
			vote: true,
			url: 'https://github.com/acme/tests/pull/7',
			exitCode: 0
		});
		const creation = fixture.calls.find((call) => call.args[1]?.endsWith('/git/refs'))!;
		expect(creation.body).toMatchObject({ sha: fixture.commit });
		const commit = fixture.calls.find((call) => call.args[1]?.endsWith('/score.csv'))!;
		const body = commit.body as { content: string; sha: string };
		expect(Buffer.from(body.content, 'base64').toString()).toBe('github_handle\nOther\nVoter\n');
		expect(body.sha).toBe('b'.repeat(40));
		expect(
			fixture.calls.filter((call) => call.args[0] === 'pr' && call.args[1] === 'create')
		).toHaveLength(1);
	});

	it('removes only the authenticated row case-insensitively', async () => {
		const fixture = voteFixture({ score: 'github_handle\nOther\nvOtEr\nThird\n' });
		await voteTest('no-informal-english', { repository: 'acme/tests', down: true, gh: fixture.gh });
		const body = fixture.calls.find((call) => call.args[1]?.endsWith('/score.csv'))!.body as {
			content: string;
		};
		expect(Buffer.from(body.content, 'base64').toString()).toBe('github_handle\nOther\nThird\n');
	});

	it('closes a pending upvote when toggled back to its main state', async () => {
		const fixture = voteFixture({ pending: [pendingVote()] });
		const result = await voteTest('no-informal-english', {
			repository: 'acme/tests',
			gh: fixture.gh
		});
		expect(result).toMatchObject({ action: 'closed', vote: false });
		expect(fixture.calls.at(-1)?.args).toEqual(['pr', 'close', '7', '--repo', 'acme/tests']);
		expect(fixture.calls.some((call) => call.body !== undefined)).toBe(false);
	});

	it('keeps explicit directions idempotent for main and pending votes', async () => {
		for (const pending of [[], [pendingVote(false)]]) {
			const fixture = voteFixture({ pending });
			expect(
				await voteTest('no-informal-english', {
					repository: 'acme/tests',
					down: true,
					gh: fixture.gh
				})
			).toMatchObject({ action: 'unchanged', vote: false });
			expect(fixture.calls.some((call) => call.body !== undefined)).toBe(false);
		}
		const fixture = voteFixture({ pending: [pendingVote()] });
		expect(
			await voteTest('no-informal-english', { repository: 'acme/tests', up: true, gh: fixture.gh })
		).toMatchObject({ action: 'unchanged', vote: true });
	});

	it('does not close another account’s similarly titled pull request', async () => {
		const fixture = voteFixture({ pending: [{ ...pendingVote(), author: { login: 'Other' } }] });
		await voteTest('no-informal-english', { repository: 'acme/tests', gh: fixture.gh });
		expect(fixture.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'close')).toBe(
			false
		);
	});

	it('rejects ambiguous pending votes and nonexistent tests before mutation', async () => {
		for (const options of [{ pending: [pendingVote(), pendingVote(false)] }, { missing: true }]) {
			const fixture = voteFixture(options);
			await expect(
				voteTest('no-informal-english', { repository: 'acme/tests', gh: fixture.gh })
			).rejects.toThrow();
			expect(fixture.calls.some((call) => call.body !== undefined)).toBe(false);
		}
	});
});

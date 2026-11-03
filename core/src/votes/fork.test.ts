import { describe, expect, it } from 'vitest';
import { voteTest } from './index.js';
import { voteFixture } from './tests/fixture.js';

describe('fork and input boundaries', () => {
	it('uses the authenticated user’s verified fork without local Git operations', async () => {
		const fixture = voteFixture({ canPush: false, score: null });
		await voteTest('no-informal-english', { repository: 'acme/tests', gh: fixture.gh });
		expect(fixture.calls.find((call) => call.args[0] === 'repo')?.args).toEqual([
			'repo',
			'fork',
			'acme/tests',
			'--clone=false',
			'--default-branch-only'
		]);
		expect(fixture.calls.find((call) => call.args[1]?.endsWith('/git/refs'))?.args[1]).toBe(
			'repos/Voter/tests/git/refs'
		);
		const pr = fixture.calls.find((call) => call.args[0] === 'pr' && call.args[1] === 'create')!;
		expect(pr.args[pr.args.indexOf('--head') + 1]).toMatch(/^Voter:agent-tests\/vote-/);
	});

	it('rejects an unrelated fork target before creating any ref or content', async () => {
		const fixture = voteFixture({ canPush: false, forkParent: 'wrong/project' });
		await expect(
			voteTest('no-informal-english', { repository: 'acme/tests', gh: fixture.gh })
		).rejects.toThrow('fork');
		expect(fixture.calls.some((call) => call.body !== undefined)).toBe(false);
	});

	it('rejects path/options injection before accessing gh', async () => {
		for (const id of ['../other', '-x', 'name;echo', 'bad/name']) {
			const fixture = voteFixture();
			await expect(voteTest(id, { gh: fixture.gh })).rejects.toThrow();
			expect(fixture.calls).toHaveLength(0);
		}
		const fixture = voteFixture();
		await expect(voteTest('test', { up: true, down: true, gh: fixture.gh })).rejects.toThrow();
		await expect(
			voteTest('test', { repository: 'https://github.com/a/b', gh: fixture.gh })
		).rejects.toThrow();
		expect(fixture.calls).toHaveLength(0);
	});

	it('rejects duplicate, hidden, foreign or malformed score rows before a write', async () => {
		for (const score of [
			'github_handle\nOther\nother\n',
			'github_handle\nOther\u200b\n',
			'github_handle\n@Other\n',
			'github_handle\nOther'
		]) {
			const fixture = voteFixture({ score });
			await expect(
				voteTest('no-informal-english', { repository: 'acme/tests', gh: fixture.gh })
			).rejects.toThrow('score.csv');
			expect(fixture.calls.some((call) => call.body !== undefined)).toBe(false);
		}
	});

	it('refuses nonregular score modes or incomplete tree metadata before any GitHub write', async () => {
		for (const options of [
			{ scoreMode: '100755' },
			{ scoreMode: '120000' },
			{ treeTruncated: true }
		]) {
			const fixture = voteFixture(options);
			await expect(
				voteTest('no-informal-english', { repository: 'acme/tests', gh: fixture.gh })
			).rejects.toThrow('score.csv');
			expect(fixture.calls.some((call) => call.body !== undefined)).toBe(false);
			expect(fixture.calls.some((call) => call.args[1]?.includes('/score.csv?ref='))).toBe(false);
		}
	});
});

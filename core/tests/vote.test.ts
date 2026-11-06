import { beforeEach, describe, expect, it, vi } from 'vitest';
import { vote } from '../cli/library/vote.ts';

const state = vi.hoisted(() => ({
	voted: false,
	pending: [] as { number: number; title: string; url: string }[],
	writes: [] as { path: string; body: any }[]
}));
vi.mock('node:child_process', () => ({
	execFileSync: vi.fn((_cmd: string, args: string[], options: any) => {
		if (args[0] === 'pr') return JSON.stringify(state.pending);
		const path = args[1]!;
		const method = args[args.indexOf('--method') + 1];
		const body = options.input ? JSON.parse(options.input) : undefined;
		if (method !== 'GET') {
			state.writes.push({ path, body });
			return JSON.stringify({ html_url: 'https://github.com/fixture/vote' });
		}
		if (path === 'user') return JSON.stringify({ login: 'fixture' });
		if (path.endsWith('/git/ref/heads/main'))
			return JSON.stringify({ object: { sha: 'a'.repeat(40) } });
		if (path.includes('/score.csv'))
			return JSON.stringify({
				sha: 'b'.repeat(40),
				content: Buffer.from(`github_handle\n${state.voted ? 'fixture\n' : ''}`).toString('base64')
			});
		if (path.includes('/test.yaml')) return '{}';
		if (path === 'repos/feuersteiner/agent-tests')
			return JSON.stringify({ permissions: { push: true } });
		throw new Error(`Unexpected request: ${path}`);
	})
}));
beforeEach(() => {
	state.voted = false;
	state.pending = [];
	state.writes = [];
});
describe('authenticated vote transitions without external writes', () => {
	it('adds exactly the signed-in user in a score-only commit', () => {
		expect(vote('formal', true)).toBe('https://github.com/fixture/vote');
		const write = state.writes.find((entry) => entry.path.includes('/score.csv'))!;
		expect(Buffer.from(write.body.content, 'base64').toString()).toBe('github_handle\nfixture\n');
		expect(state.writes).toHaveLength(3);
	});
	it('removes only the signed-in user and leaves an explicit matching vote untouched', () => {
		state.voted = true;
		expect(vote('formal', true)).toContain('already matches');
		expect(state.writes).toEqual([]);
		vote('formal', false);
		const write = state.writes.find((entry) => entry.path.includes('/score.csv'))!;
		expect(Buffer.from(write.body.content, 'base64').toString()).toBe('github_handle\n');
	});
	it('closes an opposite pending request rather than creating a second PR', () => {
		state.pending = [
			{ number: 10, title: 'vote: +1 formal', url: 'https://github.com/fixture/pull/10' }
		];
		expect(vote('formal', true)).toBe(state.pending[0]!.url);
		expect(state.writes).toEqual([]);
		expect(vote('formal', false)).toContain('Closed');
		expect(state.writes).toEqual([
			{ path: 'repos/feuersteiner/agent-tests/pulls/10', body: { state: 'closed' } }
		]);
	});
});

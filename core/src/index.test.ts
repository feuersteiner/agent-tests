import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgentTests } from './index.ts';
import { DirectorySource, FileSource } from './shared/source.ts';
import type { AgentTestConfig } from './types.ts';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseYaml } from './config/parse.ts';
import { validateTest } from './config/validate.ts';

const mocks = vi.hoisted(() => ({
	decision: vi.fn(async () => 1),
	reasoning: vi.fn(async () => 1)
}));
vi.mock('./shared/engines/decision.ts', () => ({
	DecisionalAiEngine: class {
		run = mocks.decision;
	}
}));
vi.mock('./shared/engines/reasoning.ts', () => ({
	ReasoningAiEngine: class {
		run = mocks.reasoning;
	}
}));

const config: AgentTestConfig = {
	decision: { api: 'openai', url: 'https://example.com', model: 'decision', apiKeyEnv: 'UNUSED' },
	reasoning: { api: 'openai', url: 'https://example.com', model: 'reasoning', apiKeyEnv: 'UNUSED' },
	select: { threshold: 0.5 },
	check: { threshold: 0.5, reasoning: 'low' }
};
const definition = (overrides = {}) => ({
	id: 'no-todo',
	title: 'No TODO',
	description: 'No TODO markers.',
	select: { type: 'files', glob: '**/*.ts' },
	checks: [{ id: 'no-todo', description: 'No TODO.', error: 'Resolve TODO.', grep: 'TODO' }],
	evals: [],
	...overrides
});
beforeEach(() => vi.clearAllMocks());

describe('typed suites', () => {
	it('requires selection and explicit types, rejecting stale trigger/config shapes', () => {
		for (const select of [undefined, {}, { type: 'file' }]) {
			expect(() => new AgentTests([], [definition({ select })], config)).toThrow();
		}
		expect(() => new AgentTests([], [{ ...definition(), triggers: [] }], config)).toThrow();
		expect(
			() => new AgentTests([], [definition()], { ...config, trigger: { threshold: 0.5 } })
		).toThrow();
	});

	it('selects each test independently from the original sources', async () => {
		const ts = new FileSource('src/app.ts', async () => 'TODO');
		const md = new FileSource('README.md', async () => 'done');
		const suite = new AgentTests(
			[ts, md],
			[
				definition(),
				definition({
					id: 'markdown',
					select: { type: 'files', glob: '*.md' }
				})
			],
			config
		);
		const [first, second] = await suite.run();
		expect(first?.select.flagged.map(({ source }) => source)).toEqual([ts]);
		expect(first?.check.flagged).toHaveLength(1);
		expect(second?.select.flagged.map(({ source }) => source)).toEqual([md]);
		expect(second?.check.cleared).toHaveLength(1);
	});

	it('passes directory targets intact to AI checks with configured reasoning', async () => {
		const dir = new DirectorySource('ui', async () => [
			new FileSource('ui/Button.svelte', async () => 'a\nb')
		]);
		mocks.decision.mockResolvedValueOnce(0);
		mocks.reasoning.mockResolvedValueOnce(0);
		const suite = new AgentTests(
			[dir],
			[
				definition({
					select: { type: 'directories', glob: 'ui/' },
					checks: [
						{
							id: 'layout',
							description: 'Check UI.',
							error: 'Fix layout.',
							ask: 'Correct layout.',
							reason: 'Correct layout.'
						}
					]
				})
			],
			config
		);
		const [result] = await suite.run();
		expect(result?.check.flagged[0]?.source).toBe(dir);
		expect(mocks.reasoning).toHaveBeenCalledWith({
			input: JSON.stringify({
				name: 'ui',
				children: [{ name: 'Button.svelte', kind: 'file', lines: 2 }]
			}),
			ask: 'Correct layout.',
			reasoning: 'low'
		});
	});

	it('rejects directory grep during validation and skips all downstream work on empty selection', async () => {
		expect(
			() => new AgentTests([], [definition({ select: { type: 'directories' } })], config)
		).toThrow('requires file targets');
		const read = vi.fn(async () => 'TODO');
		const suite = new AgentTests(
			[new FileSource('src/file.ts', read)],
			[
				definition({
					select: { type: 'files', glob: 'missing/', where: { glob: '*.ts', ask: 'Select.' } },
					checks: [{ id: 'ask', description: 'Ask.', error: 'Fail.', ask: 'Pass.' }]
				})
			],
			config
		);
		const [result] = await suite.run();
		expect(result?.check).toEqual({ flagged: [], cleared: [] });
		expect(read).not.toHaveBeenCalled();
		expect(mocks.decision).not.toHaveBeenCalled();
	});

	it('evaluates directory fixtures and preserves file pass/fail/skip behavior', async () => {
		const suite = new AgentTests(
			[],
			[
				definition({
					evals: [
						{ name: 'pass', path: 'src/pass.ts', content: 'done', expect: 'pass' },
						{ name: 'fail', path: 'src/fail.ts', content: 'TODO', expect: 'fail' },
						{ name: 'skip', path: 'notes.md', content: 'TODO', expect: 'skip' }
					]
				}),
				definition({
					id: 'layout',
					select: { type: 'directories', glob: 'ui/' },
					checks: [
						{ id: 'layout', description: 'Layout.', error: 'Fix layout.', ask: 'Has children.' }
					],
					evals: [
						{
							name: 'directory',
							path: 'ui',
							children: [
								{ path: 'ui/Button.svelte', content: 'button' },
								{ path: 'ui/nested', children: [] }
							],
							expect: 'pass'
						}
					]
				})
			],
			config
		);
		const results = await suite.eval();
		expect(results.map(({ result }) => result.flagged)).toEqual([[], []]);
		expect(results.map(({ result }) => result.cleared.length)).toEqual([3, 1]);
	});

	it('runs nested selection over eval fixtures and checks deduplicated final targets once', async () => {
		const suite = new AgentTests(
			[],
			[
				definition({
					select: { type: 'files', glob: '**/', where: { glob: '**/*.ts' } },
					checks: [{ id: 'ask', description: 'Ask.', error: 'Fail.', ask: 'Pass.' }],
					evals: [
						{
							name: 'nested',
							path: 'src',
							children: [
								{ path: 'src/ui', children: [{ path: 'src/ui/file.ts', content: 'text' }] }
							],
							expect: 'pass'
						}
					]
				})
			],
			config
		);
		expect((await suite.eval())[0]?.result.flagged).toEqual([]);
		expect(mocks.decision).toHaveBeenCalledTimes(1);
	});

	it('validates and evaluates every local sample', async () => {
		const root = resolve(import.meta.dirname, '../../.agents/tests');
		const definitions = readdirSync(root).map((id) =>
			validateTest(parseYaml(readFileSync(resolve(root, id, 'test.yaml'), 'utf8')))
		);
		const results = await new AgentTests([], definitions, config).eval();
		expect(results).toHaveLength(3);
		for (const { result } of results) expect(result.flagged).toEqual([]);
	});
});

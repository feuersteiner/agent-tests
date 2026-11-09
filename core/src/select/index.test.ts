import { describe, expect, it, vi } from 'vitest';
import { DirectorySource, FileSource } from '../shared/source.ts';
import { GlobEngine } from '../shared/engines/glob.ts';
import { GrepEngine } from '../shared/engines/grep.ts';
import { TestSelect } from './index.ts';
import type { SelectConfig } from './types.ts';

const config = (): SelectConfig => ({
	threshold: 0.5,
	engines: {
		glob: new GlobEngine(),
		grep: new GrepEngine(),
		decision: { run: vi.fn(async () => 1) },
		reasoning: { run: vi.fn(async () => 1) }
	}
});
const file = (path: string, content = 'text') => new FileSource(path, async () => content);

describe('nested selection', () => {
	it('selects immediate Svelte files inside matching directories', async () => {
		const cfg = config();
		const wanted = file('src/product-ui/Button.svelte');
		const sources = [wanted, file('src/product-ui/nested/Hidden.svelte'), file('src/Other.svelte')];
		const select = new TestSelect(
			{
				type: 'files',
				glob: '**/*-ui/',
				where: {
					glob: '*.svelte',
					ask: 'Displays user-facing text.'
				}
			},
			cfg
		);
		expect(select.selected(await select.run(sources))).toEqual([wanted]);
		expect(cfg.engines.decision.run).toHaveBeenCalledTimes(1);
	});

	it('traverses multiple explicit steps and evaluates grep before AI', async () => {
		const cfg = config();
		const wanted = file('src/product-ui/nested/Button.svelte', 'visible');
		const select = new TestSelect(
			{
				type: 'files',
				glob: 'src/',
				where: {
					glob: '*-ui/',
					where: {
						glob: 'nested/',
						where: {
							glob: '*.svelte',
							grep: 'visible',
							ask: 'User-facing text.'
						}
					}
				}
			},
			cfg
		);
		const result = await select.run([
			wanted,
			file('src/product-ui/nested/Hidden.svelte', 'internal')
		]);
		expect(select.selected(result)).toEqual([wanted]);
		expect(result.cleared[0]?.trace.join(' ')).toContain('ask skipped');
		expect(cfg.engines.decision.run).toHaveBeenCalledTimes(1);
	});

	it('stops empty scopes and leaves unmatched directory children unopened', async () => {
		const cfg = config();
		const children = vi.fn(async () => [file('unrelated/file.ts')]);
		const select = new TestSelect(
			{ type: 'files', glob: 'missing/', where: { ask: 'Anything.' } },
			cfg
		);
		expect(select.selected(await select.run([new DirectorySource('unrelated', children)]))).toEqual(
			[]
		);
		expect(children).not.toHaveBeenCalled();
		expect(cfg.engines.decision.run).not.toHaveBeenCalled();
		expect(await select.run([])).toEqual({ flagged: [], cleared: [] });
	});

	it('keeps directory identity and passes snapshots to AI', async () => {
		const cfg = config();
		const directory = new DirectorySource('ui', async () => [file('ui/Button.svelte', 'a\nb\n')]);
		const select = new TestSelect(
			{ type: 'directories', glob: 'ui/', ask: 'Has a component.' },
			cfg
		);
		expect(select.selected(await select.run([directory]))).toEqual([directory]);
		expect(cfg.engines.decision.run).toHaveBeenCalledWith({
			input: JSON.stringify({
				name: 'ui',
				children: [{ name: 'Button.svelte', kind: 'file', lines: 2 }]
			}),
			ask: 'Has a component.'
		});
	});

	it('continues sibling scopes after an empty branch and deduplicates overlapping scopes', async () => {
		const wanted = file('src/ui/nested/file.ts');
		const select = new TestSelect(
			{ type: 'files', glob: '**/', where: { glob: '**/*.ts' } },
			config()
		);
		expect(select.selected(await select.run([file('empty/note.md'), wanted]))).toEqual([wanted]);
	});

	it('supports filter-free selection of either target type', async () => {
		const sources = [file('src/file.ts'), file('root.md')];
		const files = new TestSelect({ type: 'files' }, config());
		expect(files.selected(await files.run(sources))).toEqual(expect.arrayContaining(sources));
		const dirs = new TestSelect({ type: 'directories' }, config());
		expect(dirs.selected(await dirs.run(sources)).map((source) => source.path)).toEqual(['src']);
	});

	it('rejects escaped source paths and malformed directory children', async () => {
		const select = new TestSelect({ type: 'files' }, config());
		await expect(select.run([file('../escape')])).rejects.toThrow('repository-relative');
		await expect(
			select.run([new DirectorySource('dir', async () => [file('outside/file')])])
		).rejects.toThrow('immediate child');
	});
});

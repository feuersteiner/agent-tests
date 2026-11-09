import { describe, expect, it, vi } from 'vitest';
import { DirectorySource, FileSource } from '../source.ts';
import { GrepEngine } from './grep.ts';
import { GlobEngine } from './glob.ts';

describe('deterministic engines', () => {
	it('matches dotfiles, alternatives, and scope-relative paths without opening sources', () => {
		const read = vi.fn();
		const file = new FileSource('src/.hidden.ts', read);
		const engine = new GlobEngine();
		expect(engine.run(file, ['**/*.js', '**/*.ts'])).toBe(true);
		expect(engine.run(file, '*.ts', '.hidden.ts')).toBe(true);
		expect(engine.run(file, '**/')).toBe(false);
		expect(engine.run(new DirectorySource('src/ui', read), 'src/*/')).toBe(true);
		expect(read).not.toHaveBeenCalled();
	});

	it('matches file content and validates all regexes before reading', async () => {
		const read = vi.fn(async () => 'TODO');
		const source = new FileSource('file', read);
		const engine = new GrepEngine();
		await expect(engine.run(source, ['TODO', '['])).rejects.toThrow();
		expect(read).not.toHaveBeenCalled();
		expect(await engine.run(source, ['missing', 'TODO'])).toBe(true);
		expect(await engine.run(source, 'todo')).toBe(false);
	});

	it('rejects directory grep before reading children', async () => {
		const read = vi.fn();
		await expect(new GrepEngine().run(new DirectorySource('dir', read), '.')).rejects.toThrow(
			'requires a file'
		);
		expect(read).not.toHaveBeenCalled();
	});
});

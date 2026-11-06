import { readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Catalog, digest } from '../cli/library/catalog.ts';
import { destination, publish } from '../cli/library/install.ts';
import { commit, init, root, temporary, write, yaml } from './support.ts';

const catalogRepo = (): string => {
	const dir = temporary();
	init(dir);
	const prose = 'By [fixture](https://github.com/fixture)\n\nFormal prose.\n';
	write(dir, 'library/formal/TEST.md', prose);
	write(
		dir,
		'library/formal/test.yaml',
		yaml.replace('triggers:', `source: sha256:${digest(prose)}\ntriggers:`)
	);
	commit(dir);
	return dir;
};
describe('pinned catalog and safe installation lifecycle', () => {
	it('validates the real community entry and pins reads despite upstream changes', async () => {
		const dir = catalogRepo();
		const catalog = await Catalog.open(dir);
		try {
			expect(catalog.list()).toEqual(['formal']);
			const test = catalog.get('formal')!;
			write(dir, 'library/formal/test.yaml', 'invalid');
			commit(dir);
			expect(catalog.get('formal')).toEqual(test);
			const parsed = readFileSync(join(root, 'library/no-informal-english/test.yaml'), 'utf8');
			expect(parsed).toContain('formal-vocabulary');
		} finally {
			await catalog.close();
		}
	});
	it('publishes complete installs, protects local edits, updates and removes clean copies', async () => {
		const catalog = await Catalog.open(catalogRepo());
		try {
			const test = catalog.get('formal')!;
			const dir = await destination(temporary(), '.', 'formal');
			await publish(dir, test, 'add');
			expect((await readdir(dir)).sort()).toEqual(['.library.json', 'TEST.md', 'test.yaml']);
			await expect(publish(dir, test, 'add')).rejects.toThrow('already installed');
			await writeFile(join(dir, 'TEST.md'), 'Local edit');
			await expect(publish(dir, test, 'update')).rejects.toThrow('Local changes');
			await expect(publish(dir, undefined, 'remove')).rejects.toThrow('Local changes');
			expect(await readFile(join(dir, 'TEST.md'), 'utf8')).toBe('Local edit');
			await writeFile(join(dir, 'TEST.md'), test.prose);
			await publish(dir, test, 'update');
			await publish(dir, undefined, 'remove');
			await expect(readdir(dir)).rejects.toThrow();
		} finally {
			await catalog.close();
		}
	});
	it('refuses traversal, symlink destinations, and extra installed files', async () => {
		const dir = temporary();
		const outside = temporary();
		await symlink(outside, join(dir, 'redirect'));
		await expect(destination(dir, 'redirect', 'formal')).rejects.toThrow('Unsafe');
		await expect(destination(dir, '..', 'formal')).rejects.toThrow('within');
		await expect(destination(dir, '.', '../formal')).rejects.toThrow();
		const catalog = await Catalog.open(catalogRepo());
		try {
			const target = await destination(dir, '.', 'formal');
			const test = catalog.get('formal')!;
			await publish(target, test, 'add');
			await writeFile(join(target, 'notes.md'), 'Keep');
			await expect(publish(target, test, 'update')).rejects.toThrow('extra files');
		} finally {
			await catalog.close();
		}
	});
});

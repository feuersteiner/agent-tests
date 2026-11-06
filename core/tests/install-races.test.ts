import { join } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { publish, destination } from '../cli/library/install.ts';
import { temporary } from './support.ts';

const race = vi.hoisted(() => ({ directory: '', active: false }));
vi.mock('node:fs/promises', async (original) => {
	const fs = await original<typeof import('node:fs/promises')>();
	return {
		...fs,
		rename: async (from: string, to: string) => {
			await fs.rename(from, to);
			if (race.active && from === race.directory) {
				race.active = false;
				await fs.writeFile(join(to, 'TEST.md'), 'Concurrent editor content');
			}
		}
	};
});
describe('atomic installation races', () => {
	it('restores concurrent edits instead of publishing over them and releases the lock', async () => {
		const root = temporary();
		const dir = await destination(root, '.', 'formal');
		const test = { id: 'formal', commit: 'a'.repeat(40), prose: 'Original', yaml: 'Definition' };
		await publish(dir, test, 'add');
		race.directory = dir;
		race.active = true;
		await expect(publish(dir, { ...test, prose: 'Upstream' }, 'update')).rejects.toThrow(
			'Concurrent edits'
		);
		expect(await readFile(join(dir, 'TEST.md'), 'utf8')).toBe('Concurrent editor content');
		expect(await readdir(join(root, '.agents/tests'))).toEqual(['formal']);
	});
});

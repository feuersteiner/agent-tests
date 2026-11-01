import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { withFixtureRepository } from './fixture.js';

describe('eval fixture cleanup', () => {
	it('removes its own initialized repository after success', async () => {
		let created = '';
		await withFixtureRepository(async (directory) => {
			created = directory;
			await access(join(directory, '.git'));
		});
		expect(created).not.toBe('');
		await expect(access(created)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	it('removes its own repository when the operation throws', async () => {
		let created = '';
		const operation = withFixtureRepository(async (directory) => {
			created = directory;
			await access(join(directory, '.git'));
			throw new Error('fixture failure');
		});
		await expect(operation).rejects.toThrow('fixture failure');
		expect(created).not.toBe('');
		await expect(access(created)).rejects.toMatchObject({ code: 'ENOENT' });
	});
});

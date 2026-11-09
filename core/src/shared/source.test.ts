import { describe, expect, it, vi } from 'vitest';
import { DirectorySource, FileSource, sourceInput } from './source.ts';

describe('typed sources', () => {
	it.each([
		['', 0],
		['one', 1],
		['one\n', 1],
		['one\ntwo', 2],
		['one\r\ntwo\r\n', 2],
		['\n', 1],
		['one\rtwo\r', 2]
	])('counts logical lines in %j', async (content, lines) => {
		expect(await new FileSource('file', async () => content).lineCount()).toBe(lines);
	});

	it('shares concurrent reads and retries failed reads', async () => {
		const read = vi.fn().mockRejectedValueOnce(new Error('read failed')).mockResolvedValue('ok');
		const file = new FileSource('file', read);
		await expect(file.open()).rejects.toThrow('read failed');
		expect(await Promise.all([file.open(), file.open(), file.lineCount()])).toEqual([
			'ok',
			'ok',
			1
		]);
		expect(read).toHaveBeenCalledTimes(2);
	});

	it('summarizes immediate children without opening nested directories', async () => {
		const nestedRead = vi.fn(async () => []);
		const nested = new DirectorySource('src/ui/nested', nestedRead);
		const file = new FileSource('src/ui/app.svelte', async () => 'one\ntwo\n');
		const read = vi.fn(async () => [file, nested]);
		const directory = new DirectorySource('src/ui', read);
		const expected = {
			name: 'ui',
			children: [
				{ name: 'app.svelte', kind: 'file', lines: 2 },
				{ name: 'nested', kind: 'directory' }
			]
		};
		expect(await directory.open()).toEqual(expected);
		expect(await directory.children()).toEqual([file, nested]);
		expect(await sourceInput(directory)).toBe(JSON.stringify(expected));
		expect(read).toHaveBeenCalledTimes(1);
		expect(nestedRead).not.toHaveBeenCalled();
	});

	it('retries directory reads and failed snapshot reads', async () => {
		const readFile = vi.fn().mockRejectedValueOnce(new Error('file')).mockResolvedValue('ok');
		const read = vi
			.fn()
			.mockRejectedValueOnce(new Error('directory'))
			.mockResolvedValue([new FileSource('dir/file', readFile)]);
		const directory = new DirectorySource('dir', read);
		await expect(directory.open()).rejects.toThrow('directory');
		await expect(directory.open()).rejects.toThrow('file');
		expect((await directory.open()).children).toEqual([{ name: 'file', kind: 'file', lines: 1 }]);
	});
});

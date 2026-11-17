import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { readFile } from '../../../src/loader/helpers/file.ts';
import { makeTempDir, removeDir, writeFiles } from '../../helpers/temp.ts';

describe('readFile', () => {
	test('returns the file text as UTF-8', () => {
		const dir = makeTempDir();
		try {
			writeFiles(dir, { 'test.yaml': 'id: café ✓\n' });
			expect(readFile(join(dir, 'test.yaml'), 'Missing test.yaml')).toBe('id: café ✓\n');
		} finally {
			removeDir(dir);
		}
	});

	test('throws the given message when the file does not exist', () => {
		const dir = makeTempDir();
		try {
			expect(() => readFile(join(dir, 'test.yaml'), 'Missing test.yaml')).toThrow(
				new Error('Missing test.yaml')
			);
		} finally {
			removeDir(dir);
		}
	});
});

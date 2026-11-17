import { describe, expect, test } from 'bun:test';
import { InMemorySource } from '../../src/sources/index.ts';

describe('InMemorySource', () => {
	test('keeps the logical path it was given, which need not exist on disk', () => {
		const source = new InMemorySource('no/such/dir/a.ts', 'text');
		expect(source.path).toBe('no/such/dir/a.ts');
	});

	test('is of kind file', () => {
		expect(new InMemorySource('a.ts', 'text').kind).toBe('file');
	});

	test.each(['const a = 1;\n', '', 'line one\r\nline two'])(
		'opens to exactly the content it was given: %p',
		(content) => {
			expect(new InMemorySource('a.ts', content).open()).toBe(content);
		}
	);
});

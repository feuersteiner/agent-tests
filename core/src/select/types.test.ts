import { expect, it } from 'vitest';
import { validateSelect } from '../config/validate.ts';

it('requires an explicit final type and rejects unknown keys', () => {
	for (const value of [{}, { glob: '**/*' }, { type: 'file' }, { type: 'files', script: 'echo' }]) {
		expect(() => validateSelect(value)).toThrow();
	}
	expect(validateSelect({ type: 'files' })).toEqual({ type: 'files' });
});

it('accepts directory traversal before a final file selection', () => {
	const select = {
		type: 'files',
		glob: '**/*-ui/',
		where: { glob: '*.svelte', ask: 'User-facing text.' }
	};
	expect(validateSelect(select)).toEqual(select);
});

it('validates nested regexes and directory/file compatibility before execution', () => {
	expect(() => validateSelect({ type: 'files', where: { grep: '[' } })).toThrow(
		'select.where.grep.0'
	);
	expect(() => validateSelect({ type: 'directories', grep: '.' })).toThrow('requires file targets');
	expect(() => validateSelect({ type: 'files', grep: '.', where: {} })).toThrow(
		'cannot precede where'
	);
	expect(() => validateSelect({ type: 'files', glob: '**/' })).toThrow('cannot return files');
	expect(() => validateSelect({ type: 'files', where: { type: 'files' } })).toThrow();
});

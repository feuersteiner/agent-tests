import { isAbsolute, win32 } from 'node:path';

/** Rejects eval paths that could escape a fixture repository or alter its Git metadata. */
export const isSafeEvalPath = (path: string): boolean => {
	if (!path || path.includes('\0') || path.includes('\\')) return false;
	if (isAbsolute(path) || win32.isAbsolute(path)) return false;
	const segments = path.split('/');
	return (
		segments.every((segment) => segment !== '..' && segment !== '.git') &&
		segments.some((segment) => segment !== '' && segment !== '.')
	);
};

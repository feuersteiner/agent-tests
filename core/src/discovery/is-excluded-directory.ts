const excluded = new Set([
	'.git',
	'node_modules',
	'.svelte-kit',
	'.output',
	'.next',
	'coverage',
	'dist',
	'dist-cli',
	'build',
	'.agents'
]);

/** Whether a directory name contains metadata, dependencies, or generated output. */
export const isExcludedDirectory = (name: string): boolean => excluded.has(name);

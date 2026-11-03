import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^agent-tests$/,
				replacement: fileURLToPath(new URL('./core/src/index.ts', import.meta.url))
			}
		]
	},
	test: {
		maxWorkers: 4,
		include: ['core/tests/**/*.test.ts', 'core/src/**/*.test.ts'],
		testTimeout: 30_000,
		hookTimeout: 120_000
	}
});

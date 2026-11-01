import { expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { editVitestConfiguration } from './vitest-edit.js';
import { initializeProject } from './index.js';

it('adds the plugin while preserving existing config and plugins', () => {
	const source = `import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
  plugins: [svelte()],
  test: { include: ['src/**/*.test.ts'] }
});\n`;
	const changed = editVitestConfiguration(source).content!;
	expect(changed).toContain("from 'agent-tests/vitest'");
	expect(changed).toContain('svelte(),');
	expect(changed).toContain('agentTestsPlugin()');
	expect(changed).toContain("test: { include: ['src/**/*.test.ts'] }");
	expect(editVitestConfiguration(changed)).toEqual({});
});

it('reuses an imported alias and does not confuse nested test properties', () => {
	const source = `import { agentTests as rules } from 'agent-tests/vitest';
export default { test: { plugins: [] } };`;
	const changed = editVitestConfiguration(source).content!;
	expect(changed).toContain('plugins: [rules()]');
	expect(changed).toContain('test: { plugins: [] }');
	expect(changed.match(/agent-tests\/vitest/g)).toHaveLength(1);
});

it('preserves comments, Unicode, strings, and an existing trailing comma', () => {
	const source = `// 🎉 plugins: []
export default defineConfig({ plugins: [other(), /* plugin comment */], test: {} });`;
	const changed = editVitestConfiguration(source).content!;
	expect(changed).toContain('/* plugin comment */');
	expect(changed).not.toContain(',,');
	expect(editVitestConfiguration(changed)).toEqual({});
});

it('recognizes an existing dollar-prefixed plugin alias without adding duplicates', () => {
	const source = `import { agentTests as $rules } from 'agent-tests/vitest';
export default defineConfig({ plugins: [$rules()] });`;
	expect(editVitestConfiguration(source)).toEqual({});
});

it.each([
	"// import { agentTests } from 'agent-tests/vitest';",
	"/* import { agentTests } from 'agent-tests/vitest'; */",
	`const example = "import { agentTests } from 'agent-tests/vitest';";`
])('does not mistake a non-code import for an active binding: %s', (prefix) => {
	const source = `${prefix}\nexport default { test: {} };`;
	const changed = editVitestConfiguration(source).content!;
	expect(
		changed.startsWith("import { agentTests as agentTestsPlugin } from 'agent-tests/vitest';")
	).toBe(true);
	const plugin = { name: 'agent-tests' };
	const executable = changed
		.replace(/^import[^\n]*\n/, '')
		.replace('export default', 'const configuration =');
	const configuration = runInNewContext(`${executable}\nconfiguration`, {
		agentTestsPlugin: () => plugin
	});
	expect(configuration.plugins).toEqual([plugin]);
	expect(editVitestConfiguration(changed)).toEqual({});
});

it('finds a real alias after commented and stringified example imports', () => {
	const source = `// import { agentTests } from 'agent-tests/vitest';
const example = "import { agentTests as wrong } from 'agent-tests/vitest';";
import { /* explanation */ agentTests as actual } from 'agent-tests/vitest';
export default { plugins: [actual()] };`;
	expect(editVitestConfiguration(source)).toEqual({});
});

it.each([
	'export default defineConfig(() => ({ test: {} }));',
	'export default mergeConfig(shared, {});',
	'export default defineConfig({ plugins: sharedPlugins });',
	'export default defineConfig({ plugins: [], ...shared });',
	'export default defineConfig({ ...shared, plugins: [] });',
	'export default { plugins };'
])('leaves unsupported dynamic configuration unchanged: %s', (source) => {
	const edit = editVitestConfiguration(source);
	expect(edit.content).toBeUndefined();
	expect(edit.reason).toContain('Preserved dynamic Vitest config');
});

it('reports manual integration without overwriting dynamic configuration', async () => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-dynamic-'));
	try {
		const source = 'export default defineConfig(() => ({ plugins: [] }));\n';
		await writeFile(join(root, 'vitest.config.ts'), source);
		const result = await initializeProject(root, { vitest: true });
		expect(result.exitCode).toBe(2);
		expect(result.warnings.join('\n')).toContain('Preserved dynamic Vitest config');
		expect(await readFile(join(root, 'vitest.config.ts'), 'utf8')).toBe(source);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

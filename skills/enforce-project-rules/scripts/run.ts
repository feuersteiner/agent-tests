#!/usr/bin/env bun
// Stopgap runner until the agent-tests CLI implements `eval` and `run`.
// Usage: bun run.ts <eval|run> <test-dir> [files...]
// Env:   AGENT_TESTS_CORE=/path/to/agent-tests/core   (required)
// Reads agent-tests.config.yaml from the current directory. Exits 1 on any flagged result.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const core = process.env.AGENT_TESTS_CORE;
const [mode, testDir, ...files] = process.argv.slice(2);
if (!core || !testDir || (mode !== 'eval' && mode !== 'run')) {
	console.error(
		'Usage: AGENT_TESTS_CORE=<agent-tests/core> bun run.ts <eval|run> <test-dir> [files...]'
	);
	process.exit(2);
}

const { AgentTest, Source } = await import(join(core, 'index.ts'));
const { parseYaml } = await import(join(core, 'src/config/parse.ts'));

const yaml = parseYaml(readFileSync(join(testDir, 'test.yaml'), 'utf8'));
const config = parseYaml(readFileSync('agent-tests.config.yaml', 'utf8'));

const paths = files.length
	? files
	: Bun.spawnSync(['git', 'ls-files']).stdout.toString().split('\n').filter(Boolean);
const sources = paths.map((path) => new Source(path, async () => readFileSync(path, 'utf8')));

const test = new AgentTest(mode === 'run' ? sources : [], yaml, config);

if (mode === 'eval') {
	const { flagged, cleared } = await test.eval(true);
	console.log(`evals: ${cleared.length}/${flagged.length + cleared.length} matched their label`);
	process.exit(flagged.length ? 1 : 0);
}

const { check } = await test.run(false);
for (const { source, check: c } of check.flagged) {
	console.log(`${source.path}  error  ${c.error}  (${test.test.id}/${c.id})`);
}
console.log(`${check.flagged.length} finding(s)`);
process.exit(check.flagged.length ? 1 : 0);

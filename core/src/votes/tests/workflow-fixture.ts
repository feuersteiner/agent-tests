import { execFileSync, spawnSync } from 'node:child_process';
import {
	chmodSync,
	existsSync,
	mkdtempSync,
	mkdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

interface Workflow {
	jobs: {
		score: {
			permissions: Record<string, string>;
			steps: { id?: string; run?: string; if?: string }[];
		};
	};
}

interface CsvModes {
	before?: '100644' | '100755' | '120000';
	after?: '100644' | '100755' | '120000';
}

export const workflow = parse(
	readFileSync(new URL('../../../../.github/workflows/library-score.yml', import.meta.url), 'utf8')
) as Workflow;

/** Exercise the workflow's actual trusted validator against real Git commits in a temporary repo. */
export const checkWorkflowVote = (
	before: string | null,
	after: string | null,
	extra = false,
	modes: CsvModes = {}
) => {
	const root = mkdtempSync(join(tmpdir(), 'agent-tests-vote-workflow-'));
	const git = (...args: string[]) =>
		execFileSync('git', args, {
			cwd: root,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		}).trim();
	try {
		git('init', '-b', 'main');
		git('config', 'user.name', 'Test');
		git('config', 'user.email', 'test@example.invalid');
		git('config', 'core.filemode', 'true');
		git('config', 'core.symlinks', 'true');
		const csv = join(root, 'library/no-informal-english/score.csv');
		const writeCsv = (text: string, mode: CsvModes['after'] = '100644') => {
			rmSync(csv, { force: true });
			if (mode === '120000') symlinkSync(text, csv);
			else {
				writeFileSync(csv, text);
				chmodSync(csv, mode === '100755' ? 0o755 : 0o644);
			}
		};
		mkdirSync(dirname(csv), { recursive: true });
		writeFileSync(join(dirname(csv), 'test.yaml'), 'id: no-informal-english\n');
		if (before !== null) writeCsv(before, modes.before);
		git('add', '.');
		git('commit', '-m', 'base');
		const base = git('rev-parse', 'HEAD');
		if (after !== null) writeCsv(after, modes.after);
		if (extra) writeFileSync(join(root, 'other.txt'), 'Unrelated code\n');
		git('add', '.');
		git('commit', '--allow-empty', '-m', 'vote');
		const head = git('rev-parse', 'HEAD');
		const outputPath = join(root, 'output');
		const run = workflow.jobs.score.steps.find((step) => step.id === 'vote')!.run!;
		const code = run.split("python3 - <<'PY'\n")[1]!.split('\nPY')[0]!;
		const result = spawnSync('python3', ['-c', code], {
			cwd: root,
			encoding: 'utf8',
			env: { ...process.env, BASE: base, HEAD: head, AUTHOR: 'Voter', GITHUB_OUTPUT: outputPath }
		});
		return {
			status: result.status,
			output: result.status === 0 && existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : ''
		};
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
};

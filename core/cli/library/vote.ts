import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { IdSchema } from '../../src/shared/types.ts';
import { repository } from './catalog.ts';

/** GitHub requests carry structured JSON on stdin; no local branch or checkout is touched. */
const gh = (args: string[], input?: unknown): any => {
	const text = execFileSync('gh', args, {
		encoding: 'utf8',
		input: input === undefined ? undefined : JSON.stringify(input),
		stdio: ['pipe', 'pipe', 'pipe']
	});
	return text.trim() ? JSON.parse(text) : undefined;
};
const api = (path: string, method = 'GET', body?: unknown): any =>
	gh(['api', path, '--method', method, ...(body === undefined ? [] : ['--input', '-'])], body);

/** Plan and open one authenticated user's one-row vote; never vote for another account. */
export const vote = (id: string, request?: boolean): string => {
	IdSchema.parse(id);
	const login = String(api('user').login);
	const sha = String(api(`repos/${repository}/git/ref/heads/main`).object.sha);
	api(`repos/${repository}/contents/library/${id}/test.yaml?ref=${sha}`);
	let original = 'github_handle\n';
	let exists = false;
	try {
		const file = api(`repos/${repository}/contents/library/${id}/score.csv?ref=${sha}`);
		original = Buffer.from(file.content, 'base64').toString('utf8');
		exists = true;
	} catch {
		/* Confirm a missing score rather than swallowing authentication or transport failures. */
		const tree = api(`repos/${repository}/git/trees/${sha}?recursive=1`);
		if (tree.truncated || tree.tree.some((entry: any) => entry.path === `library/${id}/score.csv`))
			throw new Error('Unable to read vote state');
	}
	const rows = original.trimEnd().split('\n');
	if (
		rows[0] !== 'github_handle' ||
		rows.slice(1).some((row) => !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(row)) ||
		new Set(rows.slice(1).map((row) => row.toLowerCase())).size !== rows.length - 1
	)
		throw new Error('Invalid score file');
	const voted = rows.slice(1).some((row) => row.toLowerCase() === login.toLowerCase());
	const pending = (
		gh([
			'pr',
			'list',
			'--repo',
			repository,
			'--author',
			login,
			'--state',
			'open',
			'--json',
			'number,title,url'
		]) as { number: number; title: string; url: string }[]
	).filter((pr) => [`vote: +1 ${id}`, `vote: -1 ${id}`].includes(pr.title));
	if (pending.length > 1)
		throw new Error('Multiple pending vote requests require manual resolution');
	const current = pending[0] ? pending[0].title.startsWith('vote: +1 ') : voted;
	const desired = request ?? !current;
	if (desired === current) return pending[0]?.url ?? 'Vote already matches request';
	if (pending[0]) {
		if (desired !== voted) throw new Error('Pending vote does not match main; resolve manually');
		api(`repos/${repository}/pulls/${pending[0].number}`, 'PATCH', { state: 'closed' });
		return `Closed ${pending[0].url}`;
	}
	let owner = repository.split('/')[0]!;
	if (!api(`repos/${repository}`).permissions?.push) {
		execFileSync('gh', ['repo', 'fork', repository, '--clone=false', '--default-branch-only'], {
			stdio: 'pipe'
		});
		owner = login;
	}
	const writable = `${owner}/agent-tests`;
	const branch = `vote/${id}-${randomUUID()}`;
	api(`repos/${writable}/git/refs`, 'POST', { ref: `refs/heads/${branch}`, sha });
	const next = desired
		? [...rows, login]
		: rows.filter((row, index) => index === 0 || row.toLowerCase() !== login.toLowerCase());
	const title = `vote: ${desired ? '+1' : '-1'} ${id}`;
	const baseFile = exists
		? api(`repos/${repository}/contents/library/${id}/score.csv?ref=${sha}`)
		: undefined;
	api(`repos/${writable}/contents/library/${id}/score.csv`, 'PUT', {
		message: `chore🗳️: ${title}`,
		branch,
		content: Buffer.from(`${next.join('\n')}\n`).toString('base64'),
		...(baseFile ? { sha: baseFile.sha } : {})
	});
	return String(
		api(`repos/${repository}/pulls`, 'POST', {
			title,
			body: `One vote change by @${login}.`,
			head: `${owner}:${branch}`,
			base: 'main'
		}).html_url
	);
};

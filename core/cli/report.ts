export type TestReport = {
	id: string;
	owner: string;
	exitCode: 0 | 1 | 2;
	error?: string;
	flagged?: unknown[];
	cleared?: unknown[];
};
export const exitCode = (results: TestReport[]): 0 | 1 | 2 =>
	results.some((r) => r.exitCode === 2) ? 2 : results.some((r) => r.exitCode === 1) ? 1 : 0;
export const printReport = (results: TestReport[], json = false): number => {
	const code = exitCode(results);
	if (json) console.log(JSON.stringify({ exitCode: code, results }));
	else {
		for (const result of results) {
			console.log(
				`${result.owner || '.'}/${result.id}: ${result.exitCode === 0 ? 'pass' : result.exitCode === 1 ? 'fail' : 'error'}${result.error ? `: ${result.error}` : ''}`
			);
			for (const entry of (result.flagged ?? []) as {
				path: string;
				check: { id?: string; error?: string; name?: string };
			}[]) {
				console.log(`  ${entry.path}: ${entry.check.error ?? entry.check.name ?? entry.check.id}`);
			}
		}
		console.log(`${results.length} tests; exit ${code}`);
	}
	return code;
};

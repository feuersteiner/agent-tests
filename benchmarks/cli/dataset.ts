import { hashDataset, loadDataset } from '../src/dataset.ts';

/** Checks the dataset's shape and prints its size by tier, category and label; calls no model. */
const { cases, problems } = await loadDataset();
const count = (key: 'tier' | 'category' | 'expect'): string =>
	Object.entries(Object.groupBy(cases, (item) => item[key]))
		.map(([value, items]) => `${value} ${items?.length ?? 0}`)
		.join(', ');
console.log(`${cases.length} case(s) in ${new Set(cases.map((item) => item.test)).size} Test(s)`);
console.log(`Tier: ${count('tier')}`);
console.log(`Category: ${count('category')}`);
console.log(`Label: ${count('expect')}`);
console.log(`Hash: ${hashDataset(cases)}`);
for (const problem of problems) console.error(problem);
if (problems.length) console.error(`${problems.length} problem(s).`);
process.exitCode = problems.length ? 1 : 0;

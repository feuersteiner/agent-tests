import { loadContenders } from '../src/dataset.ts';
import { writeReport } from '../src/files.ts';

/** Rebuilds `results.json` and `RESULTS.md` of a run folder from its decisions: `bun run report results/<name>`. */
const [folder] = process.argv.slice(2);
if (!folder) {
	console.error('Usage: bun run report results/<name>');
	process.exit(2);
}
writeReport(folder, loadContenders().contenders);
console.log(`Wrote ${folder}/`);

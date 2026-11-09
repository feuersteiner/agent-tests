import type { DirectorySource, TypedSource } from '../shared/source.ts';
import SelectFilters from './filters.ts';
import { candidates, sourceScope } from './scope.ts';
import type { Select, SelectConfig, SelectEntry, SelectResult, SelectStep } from './types.ts';

/** Select typed final targets through scope-relative directory steps. */
export class TestSelect {
	constructor(
		public readonly select: Select,
		public readonly config: SelectConfig
	) {}

	public readonly run = async (sources: TypedSource[], verbose = false): Promise<SelectResult> => {
		const result: SelectResult = { flagged: [], cleared: [] };
		if (sources.length === 0) return result;
		await this.runStep(sourceScope(sources), this.select, result, [], verbose);
		result.flagged = [
			...new Map(result.flagged.map((entry) => [entry.source.path, entry])).values()
		];
		return result;
	};

	public readonly selected = (result: SelectResult): TypedSource[] =>
		result.flagged.map(({ source }) => source);

	private readonly runStep = async (
		scope: DirectorySource,
		step: SelectStep,
		result: SelectResult,
		parentTrace: string[],
		verbose: boolean
	): Promise<void> => {
		const kind = step.where || this.select.type === 'directories' ? 'directory' : 'file';
		const sources = (await candidates(scope, step.glob ?? '**/*', this.config.engines.glob)).filter(
			(source) => source.kind === kind
		);
		if (verbose) console.log(`select scope=${scope.path}: ${sources.length} sources`);
		if (sources.length === 0) return;
		await Promise.all(
			sources.map(async (source) => {
				const trace = [
					...parentTrace,
					`scope=${scope.path} source=${source.path}`,
					step.glob ? 'glob passed' : 'glob skipped'
				];
				const entry: SelectEntry = { source, check: step, flagged: false, trace };
				const passed =
					(!step.grep || (await SelectFilters.GrepFilter(source, step.grep, this.config, trace))) &&
					(!step.ask || (await SelectFilters.AskFilter(source, step.ask, this.config, trace)));
				if (!passed) {
					result.cleared.push(entry);
					if (verbose) this.log(entry);
					return;
				}
				if (step.where) {
					if (source.kind !== 'directory')
						throw new Error(`where requires a directory: ${source.path}`);
					await this.runStep(source, step.where, result, trace, verbose);
				} else {
					entry.flagged = true;
					result.flagged.push(entry);
					if (verbose) this.log(entry);
				}
			})
		);
	};

	private readonly log = ({ source, flagged, trace }: SelectEntry): void => {
		console.log(`select ${source.path} ${flagged ? 'selected' : 'skipped'} ${trace.join(', ')}`);
	};
}

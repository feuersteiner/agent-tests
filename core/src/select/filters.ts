import { sourceInput } from '../shared/source.ts';
import type { TypedSource } from '../shared/source.ts';
import type { Param } from '../shared/types.ts';
import type { SelectConfig } from './types.ts';

/** True means the source passes; false stops this source's selection branch. */
interface SourceFilter {
	(source: TypedSource, param: Param, config: SelectConfig, trace: string[]): Promise<boolean>;
}

const GrepFilter: SourceFilter = async (source, param, { engines }, trace) => {
	const passed = await engines.grep.run(source, param);
	trace.push(`grep ${passed ? 'passed' : 'failed'}${passed ? '' : '; ask skipped'}`);
	return passed;
};

const AskFilter: SourceFilter = async (source, param, { engines, threshold }, trace) => {
	const input = await sourceInput(source);
	for (const ask of [param].flat()) {
		if ((await engines.decision.run({ input, ask })) >= threshold) {
			trace.push('ask passed');
			return true;
		}
	}
	trace.push('ask failed');
	return false;
};

export default { GrepFilter, AskFilter };

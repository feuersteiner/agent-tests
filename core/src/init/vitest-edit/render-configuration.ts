import type { ConfigEdit } from '../types.js';
import type { ConfigurationInspection } from './types.js';

/** Render the inspected additive edit, or return the preserved/manual result unchanged. */
export const renderConfiguration = (
	source: string,
	inspection: ConfigurationInspection
): ConfigEdit => {
	if (!inspection.context) return inspection.edit;
	const { code, start, end, array, names } = inspection.context;
	let name = names[0] ?? 'agentTestsPlugin';
	if (names.length === 0) while (new RegExp(`\\b${name}\\b`).test(code)) name = `_${name}`;

	let changed: string;
	if (array.start !== undefined && array.end !== undefined) {
		const body = code.slice(array.start + 1, array.end).trim();
		const comma = body && !body.endsWith(',') ? ',' : '';
		changed = `${source.slice(0, array.end)}${comma}\n\t\t${name}()\n\t${source.slice(array.end)}`;
	} else {
		const comma = code.slice(start + 1, end).trim() ? ',' : '';
		changed = `${source.slice(0, start + 1)}\n\tplugins: [${name}()]${comma}${source.slice(start + 1)}`;
	}
	if (names.length === 0)
		changed = `import { agentTests as ${name} } from 'agent-tests/vitest';\n${changed}`;
	return { content: changed };
};

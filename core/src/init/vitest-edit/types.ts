import type { ConfigEdit } from '../types.js';

/** Offsets of a literal root plugins array, or an unsupported property shape. */
export interface PluginArray {
	start?: number;
	end?: number;
	unsupported?: boolean;
}

/** Safe editing context; an absent context leaves the source untouched with the supplied result. */
export interface ConfigurationInspection {
	edit: ConfigEdit;
	context?: {
		code: string;
		start: number;
		end: number;
		array: PluginArray;
		names: string[];
	};
}

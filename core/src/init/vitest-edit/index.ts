import { inspectConfiguration } from './inspect-configuration.js';
import { renderConfiguration } from './render-configuration.js';
import type { ConfigEdit } from '../types.js';

/** Add the plugin to a literal exported configuration, preserving unrelated source and behavior. */
export const editVitestConfiguration = (source: string): ConfigEdit => {
	const inspection = inspectConfiguration(source);
	return renderConfiguration(source, inspection);
};

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface Plugin {
	name: string;
	setup: (app: unknown) => void;
}

const PLUGIN_DIR = 'plugins';

export const loadPlugin = async (name: string): Promise<Plugin> => {
	const source = await readFile(join(PLUGIN_DIR, `${name}.js`), 'utf8');
	const plugin = eval(source) as Plugin;
	if (plugin.name !== name) throw new Error(`Plugin ${name} reports the name ${plugin.name}`);
	return plugin;
};

import { command, type Command } from 'clinguini';
import { CONFIG_PATH, loadConfig, loadDefinitions } from '../../src/loader/index.ts';

const message = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

export const validateCommand: Command = command({
	name: 'validate',
	description: 'Validate the config and test definitions.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: ({ params }): void => {
		try {
			const definitions = loadDefinitions(params.id);
			const invalid = definitions.filter((definition) => definition.error);
			let configError: string | undefined;
			try {
				loadConfig();
			} catch (error) {
				configError = message(error);
			}
			const files = [
				...(configError ? [{ path: CONFIG_PATH, error: configError }] : []),
				...invalid
			];
			const summary = [
				configError && 'config',
				invalid.length && `${invalid.length} of ${definitions.length} test(s)`
			].filter(Boolean);
			if (files.length)
				throw new Error(
					[
						`${summary.join(' and ')} invalid:`,
						...files.map(({ path, error }) => `${path}\n  ${error!.replaceAll('\n', '\n  ')}`)
					].join('\n')
				);
			console.log(`Config and ${definitions.length} test(s) valid.`);
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

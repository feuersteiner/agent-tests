import { command, type Command } from 'clinguini';
import { CONFIG_PATH, loadConfig, loadEvalFiles, loadTestFiles } from '../../src/loader/index.ts';
import { message } from '../helpers/error.ts';

export const validateCommand: Command = command({
	name: 'validate',
	description: 'Validate the config and test definitions.',
	params: [{ name: 'id', optional: true, description: 'Exact test ID; omit for all.' }],
	handler: ({ params }): void => {
		try {
			const testFiles = loadTestFiles(params.id);
			const invalid = testFiles.filter((file) => file.error);
			const evalFiles = testFiles.flatMap((file) => (file.test ? loadEvalFiles(file.test.id) : []));
			const invalidEvals = evalFiles.filter((file) => file.error);
			let configError: string | undefined;
			try {
				loadConfig();
			} catch (error) {
				configError = message(error);
			}
			const files = [
				...(configError ? [{ path: CONFIG_PATH, error: configError }] : []),
				...invalid,
				...invalidEvals
			];
			const summary = [
				configError && 'config',
				invalid.length && `${invalid.length} of ${testFiles.length} test(s)`,
				invalidEvals.length && `${invalidEvals.length} of ${evalFiles.length} eval(s)`
			].filter(Boolean);
			if (files.length)
				throw new Error(
					[
						`${summary.join(' and ')} invalid:`,
						...files.map(({ path, error }) => `${path}\n  ${error!.replaceAll('\n', '\n  ')}`)
					].join('\n')
				);
			console.log(`Config and ${testFiles.length} test(s) valid.`);
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

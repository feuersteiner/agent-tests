import { AgentTest } from '../../src/index.ts';
import type { Command } from '../args.ts';
import { loadConfig } from '../config.ts';
import { discover } from '../discover.ts';
import { parseYaml } from '../../src/config/parse.ts';
import { validateTest } from '../../src/config/validate.ts';
import { Catalog } from './catalog.ts';
import { destination, publish } from './install.ts';
import { vote } from './vote.ts';

/** Library commands copy declarative files only; evals must pass before installation. */
export const executeLibrary = async (root: string, command: Command): Promise<number> => {
	const output: unknown[] = [];
	const id = command.args[0];
	if (command.name === 'vote') {
		output.push(vote(id!, command.options.up ? true : command.options.down ? false : undefined));
	} else if (command.name === 'list' && !command.options.remote) {
		output.push(
			...(await discover(root)).map(({ id, owner, error }) => ({
				id,
				owner,
				...(error ? { error } : {})
			}))
		);
	} else if (command.name === 'remove') {
		await publish(await destination(root, command.args[1] ?? '.', id!), undefined, 'remove');
		output.push(`Removed ${id}`);
	} else {
		const catalog = await Catalog.open();
		try {
			if (command.name === 'list') output.push(...catalog.list());
			else {
				const targets =
					command.name === 'add'
						? [{ id: id!, owner: command.args[1] ?? '.' }]
						: (await discover(root, id)).map(({ id, owner }) => ({ id, owner }));
				for (const target of targets) {
					const test = catalog.get(target.id);
					if (!test) {
						if (command.name === 'add') throw new Error('Community test does not exist');
						output.push(`${target.id}: removed upstream; local copy retained`);
						continue;
					}
					const model = new AgentTest([], validateTest(parseYaml(test.yaml)), loadConfig(root));
					const result = await model.eval();
					if (result.flagged.length) throw new Error('Community evals failed; nothing installed');
					await publish(
						await destination(root, target.owner, target.id),
						test,
						command.name === 'add' ? 'add' : 'update'
					);
					output.push(
						`${target.id}: installed from ${test.commit}. Adapt globs to this repository, preserve the rule and credit, then run validate and eval.`
					);
				}
			}
		} finally {
			await catalog.close();
		}
	}
	if (command.options.json) console.log(JSON.stringify({ exitCode: 0, results: output }));
	else
		output.forEach((entry) =>
			console.log(typeof entry === 'string' ? entry : JSON.stringify(entry))
		);
	return 0;
};

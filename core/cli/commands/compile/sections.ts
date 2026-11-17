import { TESTS_FOLDER, toTestFolder } from '../../config/paths.ts';

const ABOUT = 'agent-tests checks a repository against rules stated in plain language.';

const ROOT = 'Run commands from the repository root.';

/** A fence longer than any backtick run in `text`, so `text` cannot close it. */
const toFence = (text: string): string => {
	const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
	return '`'.repeat(Math.max(3, longest + 1));
};

/** Numbers the steps in order. */
export const toSteps = (steps: string[]): string =>
	['## Steps', '', ...steps.map((step, index) => `${index + 1}. ${step}`)].join('\n');

/** Heading and job: `test.yaml` and evals from the rule. */
export const toCompileIntro = (id: string): string =>
	[
		`# Compile the agent-tests Test \`${id}\``,
		'',
		`${ABOUT} Turn the rule below into \`${toTestFolder(id)}/test.yaml\` and evals that prove it. ${ROOT}`
	].join('\n');

/** Heading and job: the missing `TEST.md` of a named Test. */
export const toRuleIntro = (id: string): string =>
	[
		`# Write the rule of the agent-tests Test \`${id}\``,
		'',
		`${ABOUT} \`${toTestFolder(id)}/TEST.md\` is missing or blank: write it from the person's request, then compile it. ${ROOT}`
	].join('\n');

/** Heading and job: name a Test, then write its `TEST.md`. */
export const NEW_TEST_INTRO = [
	'# Write the rule of a new agent-tests Test',
	'',
	`${ABOUT} Each Test is a folder in \`${TESTS_FOLDER}/\` whose \`TEST.md\` states one rule. Write a new Test's \`TEST.md\` from the person's request, then compile it. ${ROOT}`
].join('\n');

/** The rule verbatim, in a fence it cannot close. */
export const toQuote = (id: string, rule: string): string => {
	const fence = toFence(rule);
	return [
		'## The rule',
		'',
		`From \`${toTestFolder(id)}/TEST.md\`.`,
		'',
		`${fence}markdown\n${rule}${rule.endsWith('\n') ? '' : '\n'}${fence}`
	].join('\n');
};

/** The config and keys the commands need, and who supplies them. */
export const LIMITS =
	'Leave `TEST.md` as it is. If the config is missing, ask the person to run `npx agent-tests init`. `eval` needs the API keys the config names, even for a Test using only `glob` and `grep`; ask the person for a missing one.';

/** Its fields, YAML quoting, the regular expression dialect, and glob wildcards. */
export const FIELDS = [
	'## test.yaml',
	'',
	'`version` is `1`, `id` is the folder name in lowercase kebab-case, and `title` and `description` are required text. `select` is optional, with at least one of `glob`, `grep`, `decide`; without it every source (file or directory) is inspected. `assert` is a nonempty list; each assertion has an `id` (kebab-case, unique in the Test), a `description`, an `error`, and at least one of `grep`, `decide`, `reason`.',
	'',
	'Single-quote patterns, criteria, and any text containing a colon followed by a space, which otherwise breaks the YAML. `grep` is a case-sensitive JavaScript regular expression; `^` and `$` match only the ends of the whole content. In a `glob`, `*` stays within one path segment and `**` crosses them.'
].join('\n');

/** How `select` and `assert` judge a source, and what `grep` cannot do. */
export const RUN = [
	'## How a Test runs',
	'',
	"`select` keeps a source that passes every filter present: `glob` on its path, `grep` and `decide` on its content. Each selected source then goes through each assertion's stages in the order `grep`, `decide`, `reason`. `grep` fails when it matches, a model stage when it scores below the config's threshold. The first stage passed clears the source; failing every stage present is a finding.",
	'',
	"So `grep` only catches forbidden content: `grep: 'MIT License'` flags the files that have the header. To require content, use `decide` or `reason` without `grep`."
].join('\n');

/** What the decision model is good at, how to split a rule for it, and what calls cost. */
export const CRITERIA = [
	'## One thing per criterion',
	'',
	'`decide` asks a small, fast classifier one yes-or-no question. The model sees only the criterion and one source\'s content, and it judges one observable thing well and a fuzzy concept badly. So do not ask whether a response "reveals internals": ask about each signal separately, one thing per criterion, as the example does.',
	'',
	"Conditions that must all hold are one assertion each: any one failing is a finding with that assertion's `error`. Alternatives where any one is enough go in a list inside one `decide`. An exception goes in `select`, in the `grep` that gates the model stage, or in its own narrower criterion, not in a clause added to another.",
	'',
	'A criterion states the condition for passing; in `select`, the condition for being selected. `reason` asks the slower reasoning model: keep it for judgments `decide` gets wrong. `glob` and `grep` are local and free, but each model criterion costs one call per source reaching it, so every split adds calls. Narrow with `select`, and put a broad `grep` for the forbidden content ahead of a model stage, which clears its false alarms.'
].join('\n');

/** A valid `test.yaml` that breaks a fuzzy rule into four signals, one assertion each. */
export const EXAMPLE = [
	'## Example',
	'',
	'```yaml',
	'version: 1',
	'id: errors-hide-internals',
	'title: Error responses hide internals',
	'description: Error responses from the routes reveal no internals.',
	'select:',
	"  glob: 'src/routes/**/*.ts'",
	'assert:',
	'  - id: no-stack-trace',
	'    description: No stack trace.',
	'    error: Log the stack trace instead.',
	"    grep: '[Ss]tack'",
	"    decide: 'No response includes a stack trace.'",
	'  - id: no-sql',
	'    description: No SQL.',
	'    error: Send a generic message instead.',
	"    grep: 'SQL|[Ss]ql|[Qq]uery|SELECT|INSERT|UPDATE|DELETE'",
	"    decide: 'No response includes an SQL query.'",
	'  - id: no-file-path',
	'    description: No server file path.',
	'    error: Remove the file path.',
	"    grep: '__dirname|__filename|[Pp]ath|/(home|var|srv|usr|etc)/'",
	"    decide: 'No response includes a server file path.'",
	'  - id: no-internal-host',
	'    description: No internal host.',
	'    error: Remove the internal host.',
	"    grep: '[Hh]ost|\\.internal|\\b(10|127|192\\.168)\\.\\d'",
	"    decide: 'No response names an internal host or address.'",
	'```'
].join('\n');

/** How an eval's outcome is derived, and the example's eval tree. */
export const EVALS = [
	'Each eval folder is the root of its own run. Its outcome is `skip` when nothing is selected, `fail` on any finding, else `pass`.',
	'',
	'```text',
	'.agents/tests/errors-hide-internals/evals/',
	'  stack-trace-sent/',
	'    eval.yaml             expect: fail',
	'    src/routes/user.ts    res.status(500).send(err.stack);',
	'  sql-sent/',
	'    eval.yaml             expect: fail',
	'    src/routes/user.ts    res.status(500).send(`Bad query: ${sql}`);',
	'  file-path-sent/',
	'    eval.yaml             expect: fail',
	'    src/routes/user.ts    res.status(500).send(__filename);',
	'  internal-host-sent/',
	'    eval.yaml             expect: fail',
	"    src/routes/user.ts    res.status(502).send('db.internal:5432');",
	'  stack-trace-only-logged/',
	'    eval.yaml             expect: pass',
	"    src/routes/user.ts    console.error(err.stack); res.status(500).send('Error');",
	'  logger-is-not-a-route/',
	'    eval.yaml             expect: skip',
	'    src/lib/log.ts        console.error(err.stack);',
	'```'
].join('\n');

/** Its format, with an example. */
export const TEST_MD = [
	'## TEST.md',
	'',
	"Plain language the person can read and correct: a `#` heading, the rule in one or two sentences in their words, where it applies in this repository's terms, and any exceptions. No regular expressions or model criteria.",
	'',
	'```markdown',
	'# Error responses hide internals',
	'',
	'Error responses from routes under `src/routes/` reveal no stack trace, SQL, file path, or internal host.',
	'',
	'Exceptions: details that are only logged.',
	'```'
].join('\n');

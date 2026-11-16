import { TESTS_FOLDER, toTestFolder } from '../../config/paths.ts';

const ABOUT = 'agent-tests checks a repository against rules stated in plain language.';

const ROOT = 'Run commands from the repository root; paths are relative to it.';

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

/** Files not to edit; the config and keys the commands need. */
export const LIMITS = [
	'## Limits',
	'',
	'- Do not edit `TEST.md` or `agent-tests.config.yaml`.',
	'- If the config is missing, ask the person to run `npx agent-tests init`.',
	'- `eval` needs the API keys the config names in `apiKeyEnv`, in the environment or `.env`, even for a Test using only `glob` and `grep`. If one is missing, ask the person to set it; never write a key yourself.'
].join('\n');

/** Its fields and what lists mean. */
export const TEST_YAML = [
	'## test.yaml',
	'',
	'- `version`: `1`.',
	'- `id`: the folder name, lowercase kebab-case.',
	'- `title`: a short name; `description`: the rule in one sentence.',
	'- `select` (optional): at least one of `glob`, `grep`, `decide`.',
	'- `assert`: a nonempty list of assertions, each with an `id` (kebab-case, unique in the Test), a `description`, an `error` (what to change to resolve a finding), and at least one of `grep`, `decide`, `reason`.',
	'',
	'Text must not be blank; unknown fields are rejected. Each `glob`, `grep`, `decide`, and `reason` is text or a nonempty list, and a list is an OR: any glob or pattern matching, or the best-scoring criterion. To require several conditions, write one assertion each.'
].join('\n');

/** The sources, and how `select` and `assert` judge them. */
export const RUN = [
	'## How a Test runs',
	'',
	"The sources are the files in scope (the repository's in `run`, the eval folder's in `eval`) and their ancestor directories, not the root, minus the config `ignore` globs (by default `.git`, `.agents`, `node_modules`). A path is relative, with forward slashes and no `./`: `src/lib/Save.svelte`, or `src/lib`. A directory's content lists its children, so start `select` with a glob only files match, such as `src/**/*.ts`.",
	'',
	'- `select` keeps a source when every filter present passes, in order: `glob` on the path, `grep` on the content, `decide` scoring the content at least the config `select.threshold`. Without `select`, every source is inspected.',
	'- `assert` judges each selected source against each assertion. Its stages run in order `grep`, `decide`, `reason`; the first that clears the source stops, and a finding is reported only when every stage present fails.',
	'  - `grep` fails when it matches: write it for suspect content, broad enough to catch every violation; a later model stage can clear false alarms.',
	'  - `decide` and `reason` fail when the model scores the content below the config `assert.threshold`. State each criterion as the condition for passing.'
].join('\n');

/** minimatch specifics. */
export const GLOB = [
	'### glob',
	'',
	'minimatch on the path: `*` stays in one segment, `**` crosses segments, `{ts,tsx}` lists alternatives, and dot names match. `src/**/*.ts` matches `src/a.ts` and `src/x/a.ts`; `src/**` also matches directories under `src`. No leading `!`; exclude with an extglob such as `src/**/!(*.test).ts`.'
].join('\n');

/** Regular expression specifics. */
export const GREP = [
	'### grep',
	'',
	"A JavaScript regular expression with only the `g` flag: case-sensitive, `^` and `$` match only at the ends of the whole content, and `.` does not match a line break; use `[Tt]odo`, `(^|\\n)`, `[\\s\\S]`. A pattern that can match empty text matches every source. Single-quote patterns in YAML: `grep: '\\bTODO\\b'`."
].join('\n');

/** What the models see, how to write a criterion, and what calls cost. */
export const MODELS = [
	'### decide and reason',
	'',
	"The model sees one criterion and one source's content, nothing else: not the path, other files, or the rule, and applies the criterion literally. Write each criterion as one condition the content alone can show; express exceptions it cannot show with `select`. `decide` uses the decision model; `reason`, the reasoning model, is for judgments `decide` gets wrong.",
	'',
	'`glob` and `grep` run locally; each model criterion is one call per source it reaches, so prefer `glob` and `grep` and put model stages after them.'
].join('\n');

/** The eval folder layout, and how its outcome is derived. */
export const EVALS = [
	'## Evals',
	'',
	'Each `evals/<eval-id>/` in the Test folder is a tiny repository and the root of its run: its `src/lib/Save.svelte` is the source `src/lib/Save.svelte`. Its `eval.yaml`, not a source, holds only `expect: pass`, `fail`, or `skip`. The outcome is `skip` when nothing is selected, `fail` on any finding, else `pass`. Give each eval one point and only the files it needs; name the folder for it.'
].join('\n');

/** A valid `test.yaml` and its eval tree. */
export const EXAMPLE = [
	'## Example',
	'',
	'```yaml',
	'version: 1',
	'id: user-text-french',
	'title: User text in French',
	'description: User-facing text in Svelte and HTML files is written in French.',
	'select:',
	"  glob: ['src/**/*.svelte', 'src/**/*.html']",
	"  grep: '<(p|button|label|h[1-6])\\b'",
	'assert:',
	'  - id: french-only',
	'    description: User-facing text is in French.',
	'    error: Translate the user-facing text into French.',
	"    decide: 'All text shown to an end user in this file is written in French.'",
	'```',
	'',
	'```text',
	'.agents/tests/user-text-french/evals/',
	'  english-button-label/',
	'    eval.yaml              expect: fail',
	'    src/lib/Save.svelte    <button>Save</button>',
	'  french-button-label/',
	'    eval.yaml              expect: pass',
	'    src/lib/Save.svelte    <button>Enregistrer</button>',
	'  billing-code-is-not-copy/',
	'    eval.yaml              expect: skip',
	'    src/billing/fee.ts     export const fee = 2;',
	'```'
].join('\n');

/** Its format, with an example. */
export const TEST_MD = [
	'## TEST.md',
	'',
	'Plain language the person can read and correct:',
	'',
	"- a `#` heading, then the rule in one or two sentences, in the person's words;",
	"- where it applies, in this repository's terms;",
	'- its exceptions, if any;',
	'- no regular expressions or model criteria.',
	'',
	'```markdown',
	'# User text in French',
	'',
	'User-facing text in the Svelte and HTML files under `src/` is in French.',
	'',
	'Exceptions: brand names, and code shown as code.',
	'```'
].join('\n');

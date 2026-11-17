import { TESTS_FOLDER, toTestFolder } from '../../config/paths.ts';

/** Compile prompt. */
export const READ_RULE = 'Read the rule: what must hold, where, and its exceptions.';

/** Rule prompts. */
export const FIND_RULE =
	"Find the rule in the person's request: what must hold, where, and its exceptions. Ask them what this repository cannot settle.";

/** All prompts. */
export const LOOK = 'Look at the files it covers in this repository, and those just outside.';

/** Compile prompt. */
export const WRITE_TEST_YAML = 'Write `test.yaml` as described below, revising one that exists.';

/** Compile prompt. */
export const WRITE_EVALS =
	'Write evals: a `fail` per assertion, a `pass`, a `skip`, and one per edge case.';

/** Compile prompt. */
export const toValidate = (id: string): string =>
	`Run \`npx agentests validate ${id}\` until it exits 0.`;

/** Compile prompt. */
export const toEval = (id: string): string =>
	`Run \`npx agentests eval ${id}\` until every eval matches. On a mismatch, fix \`test.yaml\` or an eval that contradicts the rule, never an expected outcome or the config just to match.`;

/** Compile prompt. */
export const REPORT = 'Report what you wrote and what `test.yaml` cannot express.';

/** New-Test prompt; `id` is the placeholder the later steps use. */
export const toName = (id: string): string =>
	`Choose an id, \`${id}\` below: lowercase kebab-case naming what the rule checks, such as \`errors-hide-internals\`, unused in \`${TESTS_FOLDER}/\`.`;

/** Named rule prompt. */
export const toReadFolder = (id: string): string =>
	`Read any \`test.yaml\` or evals already in \`${toTestFolder(id)}/\`.`;

/** Rule prompts. */
export const toWriteTestMd = (id: string): string =>
	`Write \`${toTestFolder(id)}/TEST.md\` (format below) with one rule. Each other rule is its own Test: run \`npx agentests compile\` again afterwards.`;

/** Rule prompts. */
export const toCompile = (id: string): string =>
	`Run \`npx agentests compile ${id}\` and follow the prompt it prints. Start your final report with the rule you wrote.`;

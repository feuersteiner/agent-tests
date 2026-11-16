import { TESTS_FOLDER, toTestFolder } from '../../config/paths.ts';

/** Compile prompt. */
export const READ_RULE = 'Read the rule: its conditions, where it applies, and its exceptions.';

/** Rule prompts. */
export const FIND_RULE =
	"Find the rule in the person's request: what must hold, where, and its exceptions. Ask them about anything this repository cannot settle.";

/** All prompts. */
export const LOOK =
	'Look at this repository for where the rule applies: paths, file types, and content of files in and out of scope.';

/** Compile prompt. */
export const WRITE_TEST_YAML =
	'Write `test.yaml` (reference below). If it or evals exist, revise them; keep what is right.';

/** Compile prompt. */
export const WRITE_EVALS =
	'Write evals: a `fail`, a `pass`, and a `skip` where the rule makes each meaningful, plus one per edge case the rule raises, such as a file that looks in scope but is not.';

/** Compile prompt. */
export const toValidate = (id: string): string =>
	`Run \`npx agent-tests validate ${id}\` and fix what it reports until it exits 0.`;

/** Compile prompt. */
export const toEval = (id: string): string =>
	`Run \`npx agent-tests eval ${id}\` until it exits 0: every eval matches. On a mismatch, fix \`test.yaml\`, or the eval if it contradicts the rule; never change an expected outcome just to make it match.`;

/** Compile prompt. */
export const REPORT = 'Report what you wrote, and any part of the rule `test.yaml` cannot express.';

/** New-Test prompt; `id` is the placeholder the later steps use. */
export const toName = (id: string): string =>
	`Choose an id, \`${id}\` below: lowercase kebab-case naming what the rule checks, such as \`user-text-french\`, unused in \`${TESTS_FOLDER}/\`.`;

/** Named rule prompt. */
export const toReadFolder = (id: string): string =>
	`Read any \`test.yaml\` or evals already in \`${toTestFolder(id)}/\`.`;

/** Rule prompts. */
export const toWriteTestMd = (id: string): string =>
	`Write \`${toTestFolder(id)}/TEST.md\` (format below) with one rule. Each other rule is its own Test: run \`npx agent-tests compile\` again afterwards.`;

/** Rule prompts. */
export const toCompile = (id: string): string =>
	`Run \`npx agent-tests compile ${id}\` and follow the prompt it prints. Start your final report with the rule you wrote.`;

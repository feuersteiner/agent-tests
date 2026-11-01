/** Every public V1 command, shared by argument validation and help output. */
export const commands = [
	'init',
	'add',
	'update',
	'remove',
	'compile',
	'validate',
	'list',
	'targets',
	'eval',
	'run',
	'docs',
	'vote'
] as const;

/** Render CLI usage without reading or changing repository files. */
export const help = () => `agent-tests — reusable repository checks

Usage: agent-tests <command> [arguments] [options]

Commands:
  init                       Create local configuration and test directories
  add <id> [targetDir]        Install a community library test
  update [id]                Update installed library tests
  remove <id> [targetDir]     Remove an installed library test
  compile <id>               Print the agent compilation brief
  validate [id]              Validate test structure and source freshness
  list [--remote]            List local or community tests
  targets <id>               Print selected files without running checks
  eval [id]                  Run labeled examples
  run [paths...]             Check files in the selected scope
  docs [skill]               List or print authoring skills
  vote <id> [--up|--down]     Toggle or set your community vote

Options:
  --help, -h                 Print this help
  --version                  Print the package version
  --json                     Print machine-readable results
  --changed                  Select uncommitted files
  --staged                   Select staged files
  --base <ref>               Select changes against a Git reference
  --vitest                   Include Vitest integration during init
  --github                   Include GitHub CI integration during init
  --hook                     Include the pre-commit hook during init
`;

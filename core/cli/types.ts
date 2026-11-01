/** Parsed command arguments; execution owns all library interactions. */
export interface ParsedCommand {
	command: string;
	args: string[];
	options: Record<string, string | boolean>;
}

/** Presentation returned by a command without writing to process streams. */
export interface CommandOutput {
	stdout?: string;
	stderr?: string;
	exitCode: 0 | 1 | 2;
}

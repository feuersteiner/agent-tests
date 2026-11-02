/** Raw optional file contents owned by the configuration-loading stage. */
export interface ConfigurationFiles {
	yaml: string | undefined;
	dotenv: string | undefined;
}

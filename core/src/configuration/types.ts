/** Provider configuration contains an environment-variable name, never a credential value. */
export interface ModelConfiguration {
	provider: 'openai' | 'openai-compatible';
	model: string;
	apiKeyEnv?: string;
	baseUrl?: string;
}

/** Optional repository-wide agent-tests.config.yaml settings. */
export interface AgentTestsConfig {
	model?: ModelConfiguration;
	library?: {
		repository?: string;
		ref?: string;
	};
}

/** Loaded values are private runtime state and must never be serialized to diagnostic output. */
export interface LoadedConfiguration {
	root: string;
	config: AgentTestsConfig;
	environment: NodeJS.ProcessEnv;
}

/** The one place the product's name lives. Every scene reads it from here. */
export const product = {
	name: 'agentests',
	command: 'npx agentests',
	config: 'agentests.config.yaml',
	tagline: 'Turn repository rules into tests an agent can compile, prove on evals, and run.',
	repository: 'github.com/feuersteiner/agentests'
} as const;

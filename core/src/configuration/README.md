# Configuration

`loadConfiguration(root)` reads optional `agent-tests.config.yaml` and `.env` without writing files.
Existing environment values override `.env`; the loader never changes `process.env`.

```yaml
model:
  provider: openai
  model: gpt-4.1-mini
  apiKeyEnv: OPENAI_API_KEY
```

`openai-compatible` uses the chat-completions API and accepts a `baseUrl` for compatible endpoints.
`createConfiguredModel` returns undefined when configuration or credentials are absent, allowing
callers to warn and run deterministic checks. Never print the loaded environment or credential values.
Direct Jev and Workers AI adapters are WIP; compatible HTTPS endpoints can use the generic adapter.

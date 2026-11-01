/** Default model is optional; deterministic checks work without credentials. */
export const configuration = `# Configure a decision model to enable smart/deep checks.
# model:
#   provider: openai
#   model: gpt-5-mini
#   apiKeyEnv: OPENAI_API_KEY
{}
`;

export const environmentExample =
	'# Only needed after configuring a decision model.\nOPENAI_API_KEY=\n';

export const hook = '#!/bin/sh\nexec npx --no -- agent-tests run --staged\n';

export const vitestConfiguration = `import { defineConfig } from 'vitest/config';
import { agentTests } from 'agent-tests/vitest';

export default defineConfig({
\tplugins: [agentTests()]
});
`;

export const githubWorkflow = `name: Agent tests

on:
  pull_request:

permissions:
  contents: read

jobs:
  agent-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: actions/setup-node@v7
        with:
          node-version: '24'
      - uses: oven-sh/setup-bun@v2
        if: \${{ hashFiles('bun.lock', 'bun.lockb') != '' }}
        with:
          bun-version: '1.3.4'
      - name: Install dependencies
        run: |
          if [ -f bun.lock ] || [ -f bun.lockb ]; then
            bun install --frozen-lockfile
          elif [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi
      - run: npx --no -- agent-tests run --base origin/main
`;

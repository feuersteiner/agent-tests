<script lang="ts">
	const config = `decision:
  api: openai
  url: https://api.openai.com/v1
  model: gpt-6-luna
  apiKeyEnv: OPENAI_API_KEY
reasoning:
  api: openai
  url: https://api.openai.com/v1
  model: gpt-6-luna
  apiKeyEnv: OPENAI_API_KEY
trigger:
  threshold: 0.7
check:
  threshold: 0.7
  reasoning: medium`;
	const definition = `id: formal-prose
title: Formal prose
description: Help prose uses formal English.
triggers:
  - id: help
    description: Public help documents.
    glob: 'src/help/**/*.md'
checks:
  - id: formal-words
    description: Avoid informal vocabulary.
    error: Replace gonna with going to.
    grep: '\\b[Gg]onna\\b'
evals:
  - { name: informal, path: src/help/start.md, content: gonna, expect: fail }
  - { name: formal, path: src/help/start.md, content: going to, expect: pass }
  - { name: code, path: src/internal.ts, content: gonna, expect: skip }`;
</script>

<svelte:head>
	<title>agent-tests — repository rules as checks</title>
	<meta
		name="description"
		content="Configure models, write repository checks, and evaluate them against labeled examples."
	/>
</svelte:head>

<main id="content" tabindex="-1">
	<h1>agent-tests</h1>
	<p>
		Turn repository rules into repeatable checks with regexes, decision models, and reasoning
		models.
	</p>
	<nav aria-label="On this page">
		<a href="#configure">Configure</a>
		·
		<a href="#write">Write a test</a>
		·
		<a href="#run">Run</a>
		·
		<a href="#library">Community</a>
	</nav>
	<section id="configure">
		<h2>Configure</h2>
		<p>
			Use Node 22 or newer. Install the package, then create <code>agent-tests.config.yaml</code>
			:
		</p>
		<pre><code>npm install -D agent-tests</code></pre>
		<pre><code>{config}</code></pre>
		<p>
			Set <code>OPENAI_API_KEY</code>
			in the environment or an untracked
			<code>.env</code>
			. Existing variables win. Both models and keys are required, even for regex checks. Model
			calls can incur charges.
		</p>
		<p>
			Decision APIs: <code>openai</code>
			,
			<code>jev</code>
			,
			<code>clef</code>
			. Reasoning APIs:
			<code>openai</code>
			,
			<code>anthropic</code>
			. URLs require HTTPS, except HTTP on localhost. Clef takes its full Workers AI endpoint.
		</p>
	</section>
	<section id="write">
		<h2>Write a test</h2>
		<p>
			Create <code>.agents/tests/formal-prose/TEST.md</code>
			describing the rule, then write
			<code>test.yaml</code>
			 beside it:
		</p>
		<pre><code>{definition}</code></pre>
		<p>
			Triggers use OR; their filters use AND in glob, grep, ask order. Empty triggers select every
			file. A filter's list uses OR.
		</p>
		<p>
			Checks escalate through grep, ask, and reason. Any passing rule clears the check; failure of
			every configured rule flags it. AI conditions describe what must be true to pass. Their lists
			use AND.
		</p>
		<p>
			Evals expect pass, fail, or skip and use the same triggers and checks as real files. An
			optional source SHA-256 detects stale prose. Findings report grounded quotes with one-based
			locations.
		</p>
	</section>
	<section id="run">
		<h2>Run</h2>
		<pre><code>{`npx agent-tests validate
npx agent-tests eval
npx agent-tests run
npx agent-tests run --changed
npx agent-tests run --staged
npx agent-tests run --base main`}</code></pre>
		<p>
			Changed mode reads working content, staged mode reads the index, and base mode reads committed
			HEAD changes. Base mode loads config from the base commit to protect credentials.
		</p>
		<p>
			Use <code>--json</code>
			for a JSON report or
			<code>--verbose</code>
			 for stage traces. Exit codes: 0 passes, 1 reports findings or eval mismatches, 2 reports configuration
			or runtime errors. Validation makes no model calls.
		</p>
		<p>
			Tests apply inside their owning directory, alongside ancestor tests. Dependency directories,
			metadata, env files, binaries, and symlinks are excluded from sources.
		</p>
	</section>
	<section id="library">
		<h2>Community library</h2>
		<pre><code>{`npx agent-tests list --remote
npx agent-tests add no-informal-english
npx agent-tests update
npx agent-tests list
npx agent-tests remove no-informal-english
npx agent-tests vote no-informal-english --up`}</code></pre>
		<p>
			Installations pin a catalog commit and evaluate the test before publishing its files. Adapt
			globs to the project, then validate and evaluate again. Updates preserve locally edited tests;
			scores never gate availability.
		</p>
		<p>
			Voting opens a one-row pull request using the GitHub CLI account. Vote auto-merge, automatic
			compilation, initialization, exemptions, and Vitest integration remain planned.
		</p>
		<p>
			<a href="https://github.com/feuersteiner/agent-tests/blob/main/README.md">
				Full reference and library API
			</a>
			·
			<a href="https://github.com/feuersteiner/agent-tests/blob/main/library/AGENTS.md">
				Contribution rules
			</a>
		</p>
	</section>
</main>

<style>
	main {
		max-width: 48rem;
		margin: 3rem auto;
		padding: 0 1.5rem;
		line-height: 1.65;
	}
	section {
		margin-top: 3rem;
		scroll-margin-top: 6rem;
	}
	h1,
	h2 {
		line-height: 1.2;
	}
	pre {
		max-width: 100%;
		overflow-x: auto;
		padding: 1rem;
		border: 1px solid var(--color-muted);
		border-radius: 0.5rem;
		line-height: 1.5;
	}
	a {
		color: var(--color-primary);
		text-underline-offset: 0.2em;
	}
	a:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 4px;
	}
</style>

<script lang="ts">
	import ThemePreview from '#lib/components/theme-preview.svelte';

	const modes = ['light', 'dark'] as const;
</script>

<svelte:head>
	<title>Police blue theme · agent-tests</title>
	<meta
		name="description"
		content="The agent-tests light and dark police blue palettes for Bref-ui."
	/>
</svelte:head>

<main>
	<header>
		<p class="eyebrow">agent-tests / identity</p>
		<h1>Police blue</h1>
		<p>Light and dark palettes, using Bref-ui’s semantic colors and surfaces.</p>
	</header>
	<div>
		{#each modes as mode (mode)}
			<ThemePreview {mode} />
		{/each}
	</div>
</main>

<style>
	main {
		max-width: 1120px;
		margin: auto;
		padding: 3rem 1.5rem;
	}
	header {
		margin-bottom: 2rem;
	}
	.eyebrow {
		font:
			0.6875rem/1.5 Menlo,
			Monaco,
			'Courier New',
			monospace;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-muted);
	}
	h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 500;
		letter-spacing: -0.05em;
		margin: 1rem 0 0.5rem;
	}
	header > p:last-child {
		color: var(--color-muted);
		line-height: 1.6;
	}
	div {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.5rem;
	}
	@media (max-width: 720px) {
		div {
			grid-template-columns: 1fr;
		}
	}
</style>

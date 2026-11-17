<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Theme } from 'bref-ui';
	import { product } from '../lib/product.js';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<title>{product.name} · film</title>
	<meta name="description" content={product.tagline} />
</svelte:head>

<Theme>{@render children()}</Theme>

<style>
	:global(:root) {
		--font-text: 'Inter Variable', sans-serif;
		--font-mono: 'JetBrains Mono Variable', monospace;
		font-family: var(--font-text);
		font-synthesis: none;
		-webkit-font-smoothing: antialiased;
	}
	:global(body) {
		min-height: 100svh;
	}
	:global(button),
	:global(input) {
		font: inherit;
	}
</style>

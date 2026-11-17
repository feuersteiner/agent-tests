<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		scene,
		label
	}: {
		children: Snippet;
		/** The id of the scene on stage, exposed as data-scene for the renderer. */
		scene?: string;
		/** Accessible name of the current frame, usually the scene's label. */
		label?: string;
	} = $props();
</script>

<!-- A fixed 1920×1080 light canvas; the player scales it, scenes position inside it. -->
<section data-stage data-scene={scene} data-theme="light" aria-label={label}>
	{@render children()}
</section>

<style>
	section {
		position: relative;
		width: 1920px;
		height: 1080px;
		overflow: hidden;
		isolation: isolate;
		background: var(--color-background);
		color: var(--color-foreground);
		font:
			400 32px / 1.4 var(--font-text),
			sans-serif;
		letter-spacing: -0.01em;
	}
	/* Frames must be a pure function of time: no library transition or CSS animation may run here. */
	section :global(*),
	section :global(*::before),
	section :global(*::after) {
		transition: none !important;
		animation: none !important;
	}
</style>

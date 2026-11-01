<script lang="ts">
	import { Button, Pill } from 'bref-ui';
	import type { palette } from '#lib/theme.ts';
	import ThemePalette from './theme-palette.svelte';

	interface Props {
		mode: keyof typeof palette;
	}

	let { mode }: Props = $props();
	const statuses = ['info', 'success', 'warning', 'error'] as const;
</script>

<section data-theme={mode} aria-labelledby={`title-${mode}`}>
	<h2 id={`title-${mode}`}>{mode} mode</h2>
	<div class="brand">
		<svg viewBox="0 0 144 144" aria-hidden="true">
			<path
				fill="currentColor"
				d="M72 11.85L120 29.85V60.85A89 89 0 0 1 107.67869625 106.03160622A55 55 0 0 1 72 131.85A55 55 0 0 1 36.32130375 106.03160622A89 89 0 0 1 24 60.85V29.85Z"
			/>
			<g fill="var(--color-background)">
				<rect x="44.5" y="55" width="21" height="21" />
				<rect x="78.5" y="55" width="21" height="21" />
				<rect x="44.5" y="89" width="13" height="3" />
			</g>
		</svg>
		<span>agent-tests_</span>
	</div>
	<div class="actions" aria-label={`${mode} button examples`}>
		<Button label="Primary" color="primary" variant="filled" size="small" />
		<Button label="Secondary" color="secondary" variant="soft" size="small" />
		<Button label="Disabled" color="primary" variant="filled" size="small" disabled />
	</div>
	<div class="statuses" aria-label={`${mode} status examples`}>
		{#each statuses as status (status)}
			<Pill label={status} color={status} variant="soft" size="small" />
		{/each}
	</div>
	<ThemePalette {mode} />
</section>

<style>
	h2 {
		font:
			0.6875rem/1.5 Menlo,
			Monaco,
			'Courier New',
			monospace;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-muted);
	}
	section {
		background: var(--color-background);
		color: var(--color-foreground);
		padding: 1.75rem;
		border: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		border-radius: 1rem;
	}
	.brand {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 11rem;
		font:
			400 clamp(1.125rem, 2.5vw, 1.6rem)/1 Menlo,
			Monaco,
			'Courier New',
			monospace;
		letter-spacing: -0.045em;
	}
	.brand svg {
		width: 72px;
		height: 72px;
		flex-shrink: 0;
	}
	.actions,
	.statuses {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.statuses {
		margin: 1rem 0 1.75rem;
	}
	@media (max-width: 720px) {
		section {
			padding: 1.25rem;
		}
	}
</style>

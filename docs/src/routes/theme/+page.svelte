<script lang="ts">
	import { Button, Pill } from 'bref-ui';
	import { palette } from '#lib/theme.ts';

	const modes = ['light', 'dark'] as const;
	const roles = Object.keys(palette.light) as (keyof typeof palette.light)[];
	const statuses = ['info', 'success', 'warning', 'error'] as const;
</script>

<svelte:head>
	<title>Police blue theme · agent-tests</title>
	<meta name="description" content="The agent-tests light and dark police blue palettes for Bref-ui." />
</svelte:head>

<main>
	<header>
		<p class="eyebrow">agent-tests / identity</p>
		<h1>Police blue</h1>
		<p>Light and dark palettes, using Bref-ui’s semantic colors and surfaces.</p>
	</header>
	<div class="themes">
		{#each modes as mode}
			<section class="preview" data-theme={mode} aria-labelledby={`title-${mode}`}>
				<h2 id={`title-${mode}`}>{mode} mode</h2>
				<div class="brand">
					<svg viewBox="0 0 144 144" aria-hidden="true">
						<path fill="currentColor" d="M72 11.85L120 29.85V60.85A89 89 0 0 1 107.67869625 106.03160622A55 55 0 0 1 72 131.85A55 55 0 0 1 36.32130375 106.03160622A89 89 0 0 1 24 60.85V29.85Z" />
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
					{#each statuses as status}
						<Pill label={status} color={status} variant="soft" size="small" />
					{/each}
				</div>
				<table aria-label={`${mode} semantic palette`}>
					<thead><tr><th scope="col">Role</th><th scope="col">Hex</th></tr></thead>
					<tbody>
						{#each roles as role}
							<tr>
								<th scope="row"><span class="swatch" style:background={palette[mode][role]}></span>{role}</th>
								<td>{palette[mode][role]}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/each}
	</div>
</main>

<style>
	main { max-width: 1120px; margin: auto; padding: 3rem 1.5rem; }
	header { margin-bottom: 2rem; }
	.eyebrow, h2 { font: 0.6875rem/1.5 Menlo, Monaco, 'Courier New', monospace; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-muted); }
	h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 500; letter-spacing: -0.05em; margin: 1rem 0 0.5rem; }
	header > p:last-child { color: var(--color-muted); line-height: 1.6; }
	.themes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
	.preview { background: var(--color-background); color: var(--color-foreground); padding: 1.75rem; border: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent); border-radius: 1rem; }
	.brand { display: flex; align-items: center; justify-content: center; gap: 0.5rem; min-height: 11rem; font: 400 clamp(1.125rem, 2.5vw, 1.6rem)/1 Menlo, Monaco, 'Courier New', monospace; letter-spacing: -0.045em; }
	.brand svg { width: 72px; height: 72px; flex-shrink: 0; }
	.actions, .statuses { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.statuses { margin: 1rem 0 1.75rem; }
	table { width: 100%; border-collapse: collapse; font: 0.75rem/1.6 Menlo, Monaco, 'Courier New', monospace; }
	thead { color: var(--color-muted); }
	th, td { padding: 0.6rem 0; border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 20%, transparent); font-weight: 400; }
	th { text-align: left; }
	td, thead th:last-child { text-align: right; }
	.swatch { display: inline-block; width: 14px; height: 14px; margin-right: 10px; border: 1px solid color-mix(in srgb, var(--color-muted) 40%, transparent); border-radius: 3px; vertical-align: middle; }
	@media (max-width: 720px) { .themes { grid-template-columns: 1fr; } .preview { padding: 1.25rem; } }
</style>

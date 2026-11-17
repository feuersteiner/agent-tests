<script lang="ts">
	import type { Component } from 'svelte';
	import { onMount, tick } from 'svelte';
	import { Button, Progress } from 'bref-ui';
	import Stage from '../lib/components/stage.svelte';
	import { film } from '../lib/film.svelte.js';
	import { duration, formatTime, locate, scenes, starts } from '../lib/timeline.js';

	interface SceneModule {
		default: Component<{ time: number }>;
	}

	// Each scene is src/lib/scenes/<id>.svelte; a scene without its file shows a placeholder.
	// SvelteKit 3 has no $lib alias, so the glob is relative like every other import here.
	const modules = import.meta.glob<SceneModule>('../lib/scenes/*.svelte', { eager: true });
	const components: Record<string, SceneModule['default'] | undefined> = Object.fromEntries(
		Object.entries(modules).map(([path, module]) => [
			path.slice(path.lastIndexOf('/') + 1, -'.svelte'.length),
			module.default
		])
	);

	const params = new URLSearchParams(location.search);
	const rendering = params.has('render');
	const current = $derived(locate(film.time));
	const SceneComponent = $derived(components[current.scene.id]);

	let width = $state(0);
	let height = $state(0);
	const scale = $derived(Math.min(width / 1920, height / 1080));

	const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

	onMount(() => {
		film.pause();
		film.seek(Number(params.get('t') ?? 0));
		if (rendering)
			window.__film = {
				duration,
				seek: async (seconds) => {
					film.seek(seconds);
					await tick();
					await document.fonts.ready;
					await nextFrame();
					await nextFrame();
				}
			};
		else if (!params.has('t') && !matchMedia('(prefers-reduced-motion: reduce)').matches)
			film.play();
		return () => {
			film.pause();
			delete window.__film;
		};
	});

	const onkeydown = (event: KeyboardEvent) => {
		if (rendering || event.altKey || event.ctrlKey || event.metaKey) return;
		const target = event.target instanceof Element ? event.target : undefined;
		if (target?.closest('textarea, select, [contenteditable], input:not([type="range"])')) return;
		if (event.code === 'Space') {
			// A focused button or link already acts on Space.
			if (target?.closest('button, a')) return;
			event.preventDefault();
			film.toggle();
		} else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
			event.preventDefault();
			film.seek(film.time + (event.code === 'ArrowRight' ? 5 : -5));
		}
	};
</script>

<svelte:window {onkeydown} />

{#snippet frame()}
	<Stage scene={current.scene.id} label={current.scene.label}>
		{#if SceneComponent}
			<SceneComponent time={current.time} />
		{:else}
			<div class="placeholder">
				<p>Scene {current.index + 1} of {scenes.length} · {current.scene.id}</p>
				<h1>{current.scene.label}</h1>
				<p class="clock">
					{current.time.toFixed(2)} s of {current.scene.duration} s · film {formatTime(film.time)}
				</p>
				<code>Placeholder until src/lib/scenes/{current.scene.id}.svelte exists</code>
			</div>
		{/if}
	</Stage>
{/snippet}

{#if rendering}
	<div class="render">{@render frame()}</div>
{:else}
	<main>
		<div class="viewport" bind:clientWidth={width} bind:clientHeight={height}>
			<div class="frame" style:width={`${1920 * scale}px`} style:height={`${1080 * scale}px`}>
				<div class="scaler" style:scale>{@render frame()}</div>
			</div>
		</div>
		<footer>
			<div class="transport">
				<Button
					icon={{
						name: film.playing ? 'pause' : 'play_arrow',
						label: film.playing ? 'Pause' : 'Play',
						filled: true
					}}
					color="primary"
					variant="filled"
					rounded
					onClick={film.toggle}
				/>
				<div class="seek">
					<Progress
						value={film.time / duration}
						label="Seek"
						onSeek={(value) => film.seek(value * duration)}
					/>
				</div>
				<span class="clock">{formatTime(film.time)} / {formatTime(duration)}</span>
			</div>
			<nav aria-label="Chapters">
				{#each scenes as scene, index (scene.id)}
					{@const active = scene.id === current.scene.id}
					<Button
						label={scene.label}
						size="small"
						color={active ? 'primary' : 'foreground'}
						variant={active ? 'soft' : 'neutral'}
						aria-current={active ? 'step' : undefined}
						onClick={() => film.seek(starts[index])}
					/>
				{/each}
			</nav>
		</footer>
	</main>
{/if}

<style>
	.render {
		width: 1920px;
		height: 1080px;
		overflow: hidden;
	}
	main {
		display: flex;
		flex-direction: column;
		gap: 16px;
		height: 100svh;
		padding: 24px;
		background: color-mix(in srgb, var(--color-foreground) 7%, var(--color-background));
	}
	.viewport {
		flex: 1 1 0;
		min-height: 0;
		display: grid;
		place-items: center;
	}
	.frame {
		overflow: hidden;
		border-radius: 12px;
		box-shadow: 0 12px 40px color-mix(in srgb, var(--color-foreground) 18%, transparent);
	}
	.scaler {
		width: 1920px;
		height: 1080px;
		transform-origin: 0 0;
	}
	footer {
		flex-shrink: 0;
		display: grid;
		gap: 8px;
		width: min(100%, 1280px);
		margin: 0 auto;
	}
	.transport {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.seek {
		flex: 1 1 0;
		min-width: 0;
	}
	.clock {
		font-variant-numeric: tabular-nums;
	}
	.transport .clock {
		flex-shrink: 0;
		color: var(--color-muted);
		font-size: 0.9rem;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 4px;
	}
	.placeholder {
		position: absolute;
		inset: 64px;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 24px;
		border: 4px dashed color-mix(in srgb, var(--color-muted) 40%, transparent);
		border-radius: 32px;
		color: var(--color-muted);
		text-align: center;
	}
	h1 {
		color: var(--color-foreground);
		font:
			600 96px / 1.1 var(--font-text),
			sans-serif;
		letter-spacing: -0.04em;
	}
	code {
		font-family: var(--font-mono), monospace;
	}
</style>

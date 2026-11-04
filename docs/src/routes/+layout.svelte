<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button, Theme as BrefTheme, ThemeModeToggle } from 'bref-ui-themes/crystal-code';
	import type { IconName, ThemeMode } from 'bref-ui/types';
	import logo from '#lib/assets/logo.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const repository = 'https://github.com/feuersteiner/agent-tests';
	const modes: ThemeMode[] = ['auto', 'light', 'dark'];
	const labels = { auto: 'System', light: 'Light', dark: 'Dark' };
	const icons: Record<ThemeMode, IconName> = {
		auto: 'brightness_auto',
		light: 'light_mode',
		dark: 'dark_mode'
	};
	let mode = $state<ThemeMode>('auto');

	function cycleTheme() {
		mode = modes[(modes.indexOf(mode) + 1) % modes.length];
		try {
			localStorage.setItem('agent-tests-theme', mode);
		} catch {
			// Storage is optional.
		}
	}

	onMount(() => {
		try {
			const saved = localStorage.getItem('agent-tests-theme');
			if (saved === 'auto' || saved === 'light' || saved === 'dark') mode = saved;
		} catch {
			// Follow the system when storage is unavailable.
		}
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={logo} />
</svelte:head>

<ThemeModeToggle {mode} />
<BrefTheme>
	<div class="site">
		<a class="skip-link" href="#content">Skip to content</a>
		<header>
			<a class="brand" href={resolve('/')} aria-label="agent-tests home">
				<img src={logo} alt="" width="36" height="36" />
				<strong>agent-tests</strong>
			</a>
			<div class="actions">
				<a class="github" href={repository} aria-label="agent-tests on GitHub">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
						<path
							d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
						/>
					</svg>
					<span>GitHub</span>
				</a>
				<Button
					size="small"
					variant="neutral"
					rounded
					icon={{
						name: icons[mode],
						label: `Theme: ${labels[mode]}. Switch to ${labels[modes[(modes.indexOf(mode) + 1) % modes.length]]}.`
					}}
					title={`Theme: ${labels[mode]}`}
					onClick={cycleTheme}
				/>
			</div>
		</header>
		<div class="content">{@render children()}</div>
		<footer>
			<nav aria-label="Footer">
				<a href={`${repository}/blob/main/LICENSE`}>MIT License</a>
				<a href={repository}>GitHub</a>
				<a href="https://feuersteiner.github.io/bref-ui/">Built with Bref-ui</a>
			</nav>
		</footer>
	</div>
</BrefTheme>

<style>
	:global(:root) {
		color-scheme: light dark;
	}

	:global(:root:has(meta[name='color-scheme'][content='light'])) {
		color-scheme: light;
	}

	:global(:root:has(meta[name='color-scheme'][content='dark'])) {
		color-scheme: dark;
	}

	:global(:root),
	:global(html:root [data-bref-theme='crystal-code']) {
		--color-primary: light-dark(#102d50, #4080bf);
		--color-secondary: light-dark(#2d5278, #557fa9);
		--color-background: light-dark(#f3f6f9, #080c12);
		--color-foreground: light-dark(#102d50, #f3f6f9);
		--color-muted: light-dark(#53677f, #a9b8c8);
		--color-info: light-dark(#245c91, #8fc8ed);
		--color-success: light-dark(#147a3c, #5cff8a);
		--color-warning: light-dark(#8a5a00, #ffd166);
		--color-error: light-dark(#b42336, #ff6b7a);
	}

	:global(body) {
		margin: 0;
		background: var(--color-background);
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(html:root [data-bref-theme='crystal-code']) {
		min-height: 100vh;
	}

	:global([data-bref-theme='crystal-code'] :is(h1, h2, h3, h4, h5, h6)) {
		font-family: Menlo, monospace;
	}

	.site {
		display: flex;
		min-height: 100svh;
		flex-direction: column;
	}

	.content {
		flex: 1;
	}

	header {
		position: sticky;
		top: 16px;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: min(48rem, calc(100% - 32px));
		margin: 16px auto 0;
		padding: 8px 12px;
		border: 1px solid color-mix(in srgb, var(--color-muted) 18%, transparent);
		border-radius: 20px;
		background: color-mix(in srgb, var(--color-background) 90%, transparent);
		box-shadow: 0 8px 32px color-mix(in srgb, var(--color-foreground) 6%, transparent);
		-webkit-backdrop-filter: blur(16px);
		backdrop-filter: blur(16px);
	}

	a {
		color: inherit;
		text-decoration: none;
	}

	a:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 4px;
		border-radius: 4px;
	}

	.brand,
	.actions,
	.github {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	img {
		display: block;
	}

	.brand strong {
		font:
			600 16px/1 Menlo,
			monospace;
		letter-spacing: -0.05em;
	}

	.github {
		min-height: 36px;
		padding: 0 8px;
		border-radius: 8px;
		font-size: 12px;
	}

	.github:hover {
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}

	footer {
		width: min(45rem, calc(100% - 48px));
		margin: 24px auto;
		color: var(--color-muted);
		font-size: 12px;
	}

	footer nav {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 20px;
	}

	footer a:hover {
		color: var(--color-foreground);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.skip-link {
		position: fixed;
		top: 8px;
		left: 16px;
		z-index: 3;
		padding: 12px 16px;
		background: var(--color-background);
		transform: translateY(-200%);
	}

	.skip-link:focus {
		transform: translateY(0);
	}

	@media (max-width: 420px) {
		.github span {
			display: none;
		}

		.actions {
			gap: 4px;
		}
	}

	@media (pointer: coarse) {
		.github {
			min-height: 44px;
			min-width: 44px;
			justify-content: center;
		}
	}

	@media (prefers-reduced-transparency: reduce) {
		header {
			background: var(--color-background);
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}
</style>

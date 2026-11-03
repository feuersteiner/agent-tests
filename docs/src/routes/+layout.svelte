<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button, Theme as BrefTheme, ThemeModeToggle } from 'bref-ui-themes/crystal-code';
	import type { IconName, ThemeMode } from 'bref-ui/types';
	import logoLight from '#lib/assets/logo-light.svg';
	import logoDark from '#lib/assets/logo-dark.svg';
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
	let stars = $state<number | null>(null);
	const darkMedia = $derived(
		mode === 'auto' ? '(prefers-color-scheme: dark)' : mode === 'dark' ? 'all' : 'not all'
	);
	const lightMedia = $derived(
		mode === 'auto' ? '(prefers-color-scheme: light)' : mode === 'light' ? 'all' : 'not all'
	);

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
		const controller = new AbortController();
		void fetch('https://api.github.com/repos/feuersteiner/agent-tests', { signal: controller.signal })
			.then(async (response) => (response.ok ? response.json() : null))
			.then((data) => {
				if (Number.isInteger(data?.stargazers_count) && data.stargazers_count >= 0) {
					stars = data.stargazers_count;
				}
			})
			.catch(() => {});
		return () => controller.abort();
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={logoLight} media={lightMedia} />
	<link rel="icon" type="image/svg+xml" href={logoDark} media={darkMedia} />
</svelte:head>

<ThemeModeToggle {mode} />
<BrefTheme>
	<div class="site">
		<a class="skip-link" href="#content">Skip to content</a>
		<header>
			<div class="header-inner">
				<a class="brand" href={resolve('/')} aria-label="agent-tests home">
					<picture>
						<source srcset={logoDark} media={darkMedia} />
						<img src={logoLight} alt="" width="44" height="44" />
					</picture>
					<strong>agent-tests<span aria-hidden="true">_</span></strong>
				</a>
				<p class="tagline">Lessons learned. Checks that last.</p>
				<div class="actions">
					<div class="github">
						<a
							href={repository}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Star agent-tests on GitHub"
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
								<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
							</svg>
							<span>Star</span>
						</a>
						{#if stars !== null}
							<a
								class="star-count"
								href={`${repository}/stargazers`}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`${stars} stargazers on GitHub`}
							>{stars.toLocaleString()}</a>
						{/if}
					</div>
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
			</div>
		</header>
		<div class="content">{@render children()}</div>
		<footer>
			<div class="footer-inner">
				<div>
					<strong>agent-tests</strong>
					<p>Repository checks for agent work.</p>
				</div>
				<nav aria-label="Footer">
					<a href={repository}>GitHub</a>
					<a href={`${repository}/blob/main/LICENSE`}>MIT License</a>
					<a href="https://feuersteiner.github.io/bref-ui/">Built with Bref-ui <span aria-hidden="true">↗</span></a>
				</nav>
			</div>
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

	:global(:root), :global(html:root [data-bref-theme='crystal-code']) {
		--color-primary-light: #102D50;
		--color-primary-dark: #4080BF;
		--color-secondary-light: #2D5278;
		--color-secondary-dark: #557FA9;
		--color-background-light: #F3F6F9;
		--color-background-dark: #080C12;
		--color-foreground-light: #102D50;
		--color-foreground-dark: #F3F6F9;
		--color-muted-light: #53677F;
		--color-muted-dark: #A9B8C8;
		--color-info-light: #245C91;
		--color-info-dark: #8FC8ED;
		--color-success-light: #147A3C;
		--color-success-dark: #5CFF8A;
		--color-warning-light: #8A5A00;
		--color-warning-dark: #FFD166;
		--color-error-light: #B42336;
		--color-error-dark: #FF6B7A;
		--color-primary: light-dark(var(--color-primary-light), var(--color-primary-dark));
		--color-secondary: light-dark(var(--color-secondary-light), var(--color-secondary-dark));
		--color-background: light-dark(var(--color-background-light), var(--color-background-dark));
		--color-foreground: light-dark(var(--color-foreground-light), var(--color-foreground-dark));
		--color-muted: light-dark(var(--color-muted-light), var(--color-muted-dark));
		--color-info: light-dark(var(--color-info-light), var(--color-info-dark));
		--color-success: light-dark(var(--color-success-light), var(--color-success-dark));
		--color-warning: light-dark(var(--color-warning-light), var(--color-warning-dark));
		--color-error: light-dark(var(--color-error-light), var(--color-error-dark));
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
		top: 0;
		z-index: 2;
		border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 18%, transparent);
		background: color-mix(in srgb, var(--color-background) 88%, transparent);
		-webkit-backdrop-filter: blur(16px);
		backdrop-filter: blur(16px);
	}

	.header-inner, .footer-inner {
		width: min(1120px, calc(100% - 48px));
		margin-inline: auto;
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.header-inner {
		min-height: 80px;
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

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	picture, img {
		display: block;
	}

	.brand strong {
		font: 600 19px/1 Menlo, monospace;
		letter-spacing: -0.05em;
	}

	.brand strong span {
		color: var(--color-primary);
	}

	.tagline {
		color: var(--color-muted);
		font-size: 13px;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-left: auto;
	}

	.github {
		display: inline-flex;
		align-items: stretch;
		white-space: nowrap;
		border: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		border-radius: 6px;
		overflow: hidden;
	}

	.github a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 30px;
		padding: 0 9px;
		font-size: 12px;
		font-weight: 600;
		background: color-mix(in srgb, var(--color-foreground) 3%, var(--color-background));
	}

	.github a:hover {
		background: color-mix(in srgb, var(--color-primary) 10%, var(--color-background));
	}

	.github a:focus-visible {
		outline-offset: -3px;
	}

	.github .star-count {
		border-left: 1px solid color-mix(in srgb, var(--color-muted) 25%, transparent);
		font-variant-numeric: tabular-nums;
	}

	footer {
		border-top: 1px solid color-mix(in srgb, var(--color-muted) 18%, transparent);
	}

	.footer-inner {
		justify-content: space-between;
		padding-block: 28px;
	}

	footer strong {
		font: 500 13px/1.5 Menlo, monospace;
	}

	footer p {
		margin: 6px 0 0;
		color: var(--color-muted);
		font-size: 12px;
	}

	footer nav {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
		color: var(--color-muted);
		font-size: 12px;
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

	@media (max-width: 800px) {
		.tagline {
			display: none;
		}
	}

	@media (max-width: 560px) {
		.header-inner, .footer-inner {
			width: calc(100% - 32px);
			gap: 12px;
		}

		.header-inner {
			min-height: 68px;
		}

		.brand strong {
			font-size: 16px;
		}

		.brand img {
			width: 36px;
			height: 36px;
		}

		.brand {
			gap: 4px;
		}

		.actions {
			gap: 6px;
		}

		.footer-inner {
			align-items: flex-start;
			flex-direction: column;
			gap: 20px;
		}

		footer nav {
			gap: 18px;
		}
	}

	@media (max-width: 380px) {
		.github a > span, .github .star-count {
			display: none;
		}
	}

	@media (pointer: coarse) {
		.github a {
			min-height: 44px;
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

<script lang="ts">
	import { Theme } from 'bref-ui';
	import { palette } from '#lib/theme.ts';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Theme {palette} />

{@render children()}

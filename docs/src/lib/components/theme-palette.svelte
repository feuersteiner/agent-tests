<script lang="ts">
	import { palette } from '#lib/theme.ts';

	interface Props {
		mode: keyof typeof palette;
	}

	let { mode }: Props = $props();
	const roles = Object.keys(palette.light) as (keyof typeof palette.light)[];
</script>

<table aria-label={`${mode} semantic palette`}>
	<thead>
		<tr>
			<th scope="col">Role</th>
			<th scope="col">Hex</th>
		</tr>
	</thead>
	<tbody>
		{#each roles as role (role)}
			<tr>
				<th scope="row">
					<span style:background={palette[mode][role]}></span>
					{role}
				</th>
				<td>{palette[mode][role]}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		font:
			0.75rem/1.6 Menlo,
			Monaco,
			'Courier New',
			monospace;
	}
	thead {
		color: var(--color-muted);
	}
	th,
	td {
		padding: 0.6rem 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 20%, transparent);
		font-weight: 400;
	}
	th {
		text-align: left;
	}
	td,
	thead th:last-child {
		text-align: right;
	}
	span {
		display: inline-block;
		width: 14px;
		height: 14px;
		margin-right: 10px;
		border: 1px solid color-mix(in srgb, var(--color-muted) 40%, transparent);
		border-radius: 3px;
		vertical-align: middle;
	}
</style>

# agent-tests docs

Svelte 5 / SvelteKit scaffold using Bref-ui. `Theme` is mounted in the root layout.

Run from the repository root:

```sh
bun install
bun run dev
bun run check
bun run build
bun run preview
```

Created with:

```sh
bunx sv@latest create docs --template minimal --types ts --no-add-ons --no-install
bun add --cwd docs bref-ui@latest
```

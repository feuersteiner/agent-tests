# docs agent guide

## Conciseness first

- One idea per sentence; start every page with a one-sentence description.
- Show the shortest example that works, and keep displayed code identical to
  what it demonstrates.
- Cut before adding: no filler, repetition, tables, or decorative sections.
- Document only implemented behavior; mark planned features WIP.

## Site

- Keep the site static: every route prerenders with `@sveltejs/adapter-static`.
  Build links with Kit's `resolve()` and base-relative paths, never `/...`.
- Use Svelte 5 runes and typed snippets; no legacy syntax.
- Import components only through the public `bref-ui` and `bref-ui/types`
  exports. Docs-only code stays in this package.
- Change colors only in `src/lib/theme.ts`; never inline them.

## Structure

- Each page lives in `src/routes/<topic>/+page.svelte`, with page-specific
  examples inline. Shared documentation components belong in `#lib/components/`.
- Use kebab-case filenames, camelCase props, and PascalCase types.
- Add files only when needed: no `examples/` directories or trivial wrappers.

## Styling and accessibility

- Use scoped CSS, semantic selectors, and existing theme tokens. Keep fonts and
  global styles in the site theme setup.
- Keep content widths readable and layouts usable on narrow screens; contain
  wide code blocks.
- Use semantic HTML, logical headings, labeled controls, and visible keyboard
  focus.

Verify with `bun run --cwd docs check` and
`BASE_PATH=/agent-tests bun run build`.

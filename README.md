# agent-tests

Turn recurring agent mistakes and review lessons into reusable repository checks.

Learn a rule during an agent session, save it as a check, and verify future changes against it. Each result should explain what was checked, what was found, and what needs attention.

**Status:** design stage. No CLI implementation is available yet. The behavior below describes the intended product; file formats and command syntax remain undecided.

## Scope

Agent-tests is a CLI for checks only. Checks inspect a repository, selected files, or a proposed change without modifying the target.

Examples:

- Component filenames follow PascalCase.
- Files under billing do not import UI utilities.
- API handlers validate inputs before using them.
- A component directory contains the required files.
- User-facing text is written in French.
- A change preserves a rule learned during an earlier review.

Checks return findings and recovery guidance. Creating files, rewriting content, and applying fixes belong to actions outside agent-tests.

## Workflow

1. An agent or reviewer identifies a rule worth preserving.
2. An agent translates the rule into a reusable check with examples and expected outcomes.
3. The check is validated against those examples before reuse.
4. Relevant checks are selected for a repository area, task, or change.
5. The CLI executes them and reports results with supporting evidence.
6. New review lessons become additional checks or improvements to existing ones.

The intended CLI covers installing, validating, running, and reporting checks. Optional sharing through a GitHub registry remains under consideration.

## Check definitions

A check needs:

- A stable name and a plain-language description of the rule.
- An applicability scope, such as paths, repository areas, or types of changes.
- The inputs and execution method needed to evaluate it.
- Explicit pass, fail, and any warning criteria.
- Evidence to include in a finding and guidance for addressing a failure.
- Test fixtures with expected results, including passing and failing examples.

The exact package layout and definition format remain open.

## Execution

Checks may use deterministic logic such as regex, text matching, structural inspection, or scripts; Jev / decision models; or an LLM evaluator. A check only needs the methods appropriate to its rule.

Deterministic regex construction from structured rules and literal regex written by an agent are both supported design goals. Either form needs examples that validate its behavior.

Model-based checks need explicit evaluation criteria. Model configuration, method selection, escalation, and handling uncertain results remain to be specified; automatic fallback is not assumed.

Existing test frameworks may supply evidence through adapters or commands where their execution can preserve the read-only target contract.

## Results

| Result | Meaning |
| --- | --- |
| Passed | The check applied and the target met the rule. |
| Failed | The check applied and found a violation. |
| Warning | The check applied and found an explicitly defined advisory issue. |
| Irrelevant | The check did not apply to the target or change. |

An execution error is separate from these results. Missing inputs, unavailable providers, and invalid evaluator responses must not be reported as passing checks. Uncertainty must be reported explicitly rather than treated as success or irrelevance.

Results should be available to people and agents. Findings identify the check, affected paths or locations, expected behavior, observed evidence, and useful correction guidance. Output schemas and exit codes remain undecided.

## Relationship to nippet

**Agent-tests checks; nippet acts.** Agent-tests evaluates conventions and changes. Nippet creates or transforms files, folders, names, and text.

Neither CLI requires the other. Both may eventually consume shared infrastructure for model adapters, YAML/schema utilities, and structured errors. No shared library exists yet; extraction should follow demonstrated implementation needs.

## Setup and verification

This repository is a Bun workspace with two packages:

- `core/`: the library scaffold, created with `bun init --yes core`. No CLI implementation exists yet.
- `docs/`: a Svelte 5 / SvelteKit site using [Bref-ui](https://github.com/feuersteiner/bref-ui), created with `bunx sv@latest create docs --template minimal --types ts --no-add-ons --no-install`.

Use Bun 1.3.4 or newer. Run commands from the repository root:

```sh
bun install           # install both workspaces with one lockfile
bun run dev           # start the docs site
bun run check         # type-check core and docs
bun run build         # build the docs site
bun run preview       # preview the docs build
```

For a reproducible installation, use `bun install --frozen-lockfile`.

### Packaging and publishing

The root `README.md` and MIT `LICENSE` are the source documents. The core
package's `prepack` hook copies both into `core/` before `npm pack` or
`npm publish`. These generated copies are ignored by Git.

```sh
bun run --cwd core prepack        # copy the root README and license
bun run pack                     # create the npm package in core/
(cd core && npm pack --dry-run)   # inspect package contents without publishing
BASE_PATH=/agent-tests bun run build # verify the GitHub Pages build locally
```

The workflows follow [Bref-ui's release setup](https://github.com/feuersteiner/bref-ui/tree/main/.github/workflows):

- `.github/workflows/docs.yml` deploys `docs/build` on pushes to `main` or manual dispatch. Set the repository's **Settings → Pages → Source** to **GitHub Actions**. The workflow supplies the Pages base path, including `/agent-tests` for the default project URL.
- `.github/workflows/publish-core.yml` publishes when `core/package.json` changes on `main`, or on manual dispatch, then creates an `agent-tests@<version>` GitHub release. Bump the core version for each release; npm rejects already published versions.

Configure an [npm trusted publisher](https://docs.npmjs.com/trusted-publishers/)
for package `agent-tests`, GitHub owner `feuersteiner`, repository `agent-tests`,
and workflow filename `publish-core.yml`, with direct publishing enabled.
If the package does not exist yet, publish the first version manually from
`core/` with `npm publish --access public` using an authorized npm account,
then configure its trusted publisher. CI uses OIDC and requires no npm token.
Node.js 24 and its npm CLI are used for publishing and package verification;
Bun manages workspace dependencies.

### Logo concept

Run `python3 -m http.server 8000` from the repository root, then open
`http://localhost:8000/logo.html`. No build or installation is required; Google
Fonts supplies the Material Symbols shield and typeface, so internet access is required.
Verify the logo on desktop and mobile, and use the accent swatches to preview colors.
The pixel-art variant is at `http://localhost:8000/logo-pixel.html`; its shield
uses a CSS pixel grid and does not require the Material Symbols font.
Compare square eyes, terminal typography, green, and monochrome at
`http://localhost:8000/logo-terminal.html`. These studies use a custom SVG shield
with a Material-inspired pointed crest, sloped shoulders, 110-unit (2 × 55) width and
89-unit flank radii. Verify all four studies
fit desktop and mobile widths.
Enable “Show Fibonacci circles” to inspect the 144-unit shield frame, 21-unit
eyes, 13-unit eye gap and dash width, and 3-unit dash thickness. Verify the
construction toggle at desktop and mobile widths: blue circles construct the
shield and gold circles construct the face. No build step is required.

## License

[MIT](LICENSE).

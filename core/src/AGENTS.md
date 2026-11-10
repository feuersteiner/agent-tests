# src agent guide

`trigger/`, `check/`, and `evals/` follow one pattern.

## Files

- `types.ts`: Zod schemas with their inferred types, plus the config type and funcs interface when the feature has funcs.
- Funcs file (`trigger/filters.ts`, `check/rules.ts`): const arrow functions, no classes, default-exported as one object. Evals have none.
- `index.ts`: a `Test<Feature>` class whose `run` returns a `Result<T>`.

## Funcs

- All funcs in a file share one interface: `(source, param, config, trace) => Promise<boolean>`.
- JSDoc states in plain English what `true` and `false` mean, because the direction differs: a filter returns `true` when it passes, a rule when it fails.
- A func that fails adds itself to `trace`, such as `failed grep`.

## Results

`Result` and `ResultEntry` live in `shared/types.ts`:

```ts
type ResultEntry<T> = { source: Source; check: T; flagged: boolean; trace: string[] };
type Result<T> = { flagged: ResultEntry<T>[]; cleared: ResultEntry<T>[] };
```

Runners and results accept the abstract `Source` contract, including independent
subclasses returning string content. Glob matches paths without opening sources;
grep, ask, and reason consume the text returned by `open()` directly.

- `check` holds the trigger, check, or eval that ran.
- `flagged` means it fired: a trigger matched, a check found a violation, or an eval did not match its label.
- `trace` lists what failed along the way, for verbose output.

## `run`

Push each entry as it finishes, and log it then when `verbose` is set, so output streams in finish order. Each class has its own private `log`:

```ts
const flagged: ResultEntry<T>[] = [];
const cleared: ResultEntry<T>[] = [];

await Promise.all(
	items.map(async (item) => {
		const entry = await this.runItem(item);
		(entry.flagged ? flagged : cleared).push(entry);
		if (verbose) this.log(entry);
	})
);

return { flagged, cleared };
```

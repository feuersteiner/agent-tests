# Engines

Factories create cached pattern engines and lazily initialized AI engines. Every
engine accepts `(input, criteria, config?)` and returns `Promise<number>`.

- Glob returns `0` or `1`.
- Grep returns a nonnegative integer occurrence count. Use `count > 0` for a normal
  match. Patterns use JavaScript regex syntax, with global, non-overlapping matches.
  Capturing groups do not add matches. Zero-width matches count and advance safely;
  for example, `(?=TODO)` counts each position immediately before `TODO`.
- Decide and reason return support scores in `[0, 1]`.

Criteria lists are OR alternatives. Grep returns the highest individual pattern
count, so duplicate or overlapping alternatives do not inflate the result. Glob
returns whether any pattern matches; AI engines return the highest score.

Invalid criteria or regexes reject the promise. Cached regexes can be reused across
calls without carrying over match positions.

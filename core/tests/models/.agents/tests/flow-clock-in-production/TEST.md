# Production code reads the time from the clock

Production code never reads the current time with `Date.now()` or `new Date()`; it calls `clock.now()` from `lib/clock.ts`, so tests can control the time.

It applies to the TypeScript files under `src/`, where tests sit next to the code they test.

Exceptions: test files, which may read the real time or build their own dates. Building a date from a given value, such as `new Date(row.createdAt)`, is not reading the current time.

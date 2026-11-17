# No file-wide ESLint disable in hand-written code

Hand-written code never turns ESLint rules off for a whole file with an `eslint-disable` block comment; it disables a rule for one line with `eslint-disable-next-line` or `eslint-disable-line`, or fixes the code.

It applies to the TypeScript files under `src/`, where generated clients and types sit next to hand-written modules.

Exceptions: generated files, produced by a tool and marked as generated, which may disable ESLint for the whole file.

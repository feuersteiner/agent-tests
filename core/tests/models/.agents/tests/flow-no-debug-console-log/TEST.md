# No stray console.log

Application code never prints with `console.log`; it logs through the app's logger, so no debug print ships.

It applies to the TypeScript and TSX files under `src/`.

Exceptions: the logger's own implementation, which writes its records to the console with `console.log`.

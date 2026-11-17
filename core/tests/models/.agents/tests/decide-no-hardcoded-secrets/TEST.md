# No hard-coded secrets

Source code under `src/` never contains a hard-coded secret: API keys, tokens, and passwords are read from the environment, never written as literal values.

Applies to the TypeScript and JavaScript files under `src/`.

Exceptions: none in code; documentation outside `src/` is not checked.

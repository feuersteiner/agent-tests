# Triggers

Triggers select owner-relative file paths and text without executing checks or writing files.

`evaluateTriggers` evaluates each alternative in order, stopping at the first passing one.
Within an alternative, path and content filters run in their written order, including
the order of `match` and `ask`. Pattern arrays are alternatives: any glob or regex may match.
Path globs include dotfiles; regular expressions use JavaScript syntax without delimiters.

`path.ask` receives only the path. `content.ask` receives the path and file text.
Missing models and unsure answers leave selection unresolved, with a warning. A later
model-free alternative can still select the file. Provider failures throw a sanitized error.

`selectTargets` applies these decisions to candidates and returns selected and unresolved files.
Discovery supplies candidate content; callers convert repository paths to each test owner's scope.
Checks and file reads belong to other stages.

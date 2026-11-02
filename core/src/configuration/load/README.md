# Configuration loading

`loadConfiguration(root, environment)` resolves the root, calls `readConfigurationFiles`,
`collectEnvironment` and `assembleConfiguration`, then returns the loaded root, configuration
and environment. `readConfigurationFiles` reads optional YAML and dotenv files concurrently
through `readOptional` in `utils.ts`; missing files are allowed and other read errors propagate.
`collectEnvironment` copies defined values. `assembleConfiguration` parses YAML and dotenv,
with supplied environment values taking precedence, including empty strings.

This stage never writes files or changes `process.env`. Invalid configuration remains an error.
Callers import `loadConfiguration` from this entry or the configuration barrel; supporting
functions and `ConfigurationFiles` are internal to this stage.

# YAML parsing

`parseTestYaml(text)` calls the internal `parseYaml` decoder, then the public
`parseTestDefinition` stage. The decoder rejects duplicate keys and aliases and replaces
parser errors with `Invalid test YAML`; definition validation reports only the invalid field.
Input key order is preserved. Callers use this stage entry or the schema barrel.

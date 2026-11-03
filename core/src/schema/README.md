# Schema

Parse `test.yaml` through `parseTestYaml`, or validate an object with `parseTestDefinition`.
Every object rejects unknown keys. Parsing preserves written filter order and rejects duplicate
keys and YAML aliases. Errors identify the invalid field without repeating input values.
`source` may be absent; the validation stage reports missing or stale compilation hashes.

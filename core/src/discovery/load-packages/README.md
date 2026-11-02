# Compiled package discovery

`discoverTests(path)` canonicalizes the root, calls `loadPackages`, then
`applyExemptions`. `loadPackages` traverses eligible directories and calls
`loadPackage` to parse compiled YAML and local disable configuration.
`applyExemptions` attaches descendant exemptions to inherited rules.
Invalid definitions, mismatched identifiers, and I/O failures propagate. No files are written.

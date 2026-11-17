# Security

We once loaded plugins with `eval(source)`. That ran any code a plugin author shipped,
so plugins now load through `import()` from a reviewed allowlist.

# Rule directory discovery

`discoverTestDirectories(path)` canonicalizes the root, calls `walkDirectories`,
then `findDirectories` to list real `.agents/tests/<id>` folders in stable order.
Definitions are not parsed, so validation can inspect broken or uncompiled rules.
Generated directories and symlinks are excluded; I/O failures propagate. No writes occur.

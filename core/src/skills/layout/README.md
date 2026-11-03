# Repository outline

`describeLayout(root)` reads a bounded outline without file contents or writes.

Discovery's `walkDirectories` supplies real directories with the shared generated
and dependency exclusions. `collectRows` lists visible files before child
directories, stops reading files beyond depth three, and caps output at 80 entries.
`renderRows` adds the limit marker or empty-repository label. Hidden directory
names and hidden file names are omitted. Filesystem read failures propagate.

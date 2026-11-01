import { copyFile } from 'node:fs/promises';

await Promise.all(
  ['README.md', 'LICENSE'].map((filename) =>
    copyFile(
      new URL(`../${filename}`, import.meta.url),
      new URL(`../core/${filename}`, import.meta.url),
    ),
  ),
);

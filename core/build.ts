import { cp, mkdir, rm, chmod } from 'node:fs/promises';
import { $ } from 'bun';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await $`bun build index.ts --target=node --format=esm --packages=bundle --external=zod --outfile=dist/index.js`;
await $`bun build src/types.ts --target=node --format=esm --external=zod --outfile=dist/types.js`;
await $`bun build cli/index.js --target=node --format=esm --external=zod --outfile=dist/cli/index.js`;
await $`tsc --project tsconfig.build.json`;
await chmod('dist/cli/index.js', 0o755);
await Promise.all(['README.md', 'LICENSE'].map((file) => cp(`../${file}`, file)));

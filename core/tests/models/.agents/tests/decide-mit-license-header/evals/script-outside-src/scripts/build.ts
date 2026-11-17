import { execSync } from 'node:child_process';

execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' });

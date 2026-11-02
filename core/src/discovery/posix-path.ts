import { sep } from 'node:path';

/** Convert native separators to the path notation used in test definitions. */
export const posixPath = (path: string): string => path.split(sep).join('/');

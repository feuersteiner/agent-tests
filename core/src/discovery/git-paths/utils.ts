/** Decode Git's NUL-delimited paths without trimming whitespace in filenames. */
export const splitPaths = (output: string): string[] => output.split('\0').filter(Boolean);

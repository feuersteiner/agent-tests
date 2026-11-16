/** The Tests folder, relative to the directory the CLI runs from, the repository root; the loader reads the same path. */
export const TESTS_FOLDER = '.agents/tests';

/** The folder of the Test named `id`, relative to the same directory. */
export const toTestFolder = (id: string): string => `${TESTS_FOLDER}/${id}`;

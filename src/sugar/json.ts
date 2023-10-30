/**
 * Helper for quickly finding/loading JSON files on the classpath.
 *
 * @param path to the JSON to load.
 * @returns
 */
export function json(path: string): any {
  return import(path);
}

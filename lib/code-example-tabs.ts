/** Complete examples expose source, configuration, and supporting project files. */
export function isCodeExampleTab(path: string, includeConfig = true): boolean {
  const filename = path.replace(/\\/g, "/").split("/").at(-1)?.toLowerCase();
  return Boolean(filename) && (includeConfig || ![".gitignore", "readme.md", "package.json"].includes(filename!));
}

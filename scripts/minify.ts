import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIST_DIR = "dist";

async function getJsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getJsFiles(fullPath)));
    } else if (entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function minifyFile(filePath: string): Promise<void> {
  const code = await readFile(filePath, "utf-8");

  const result = await Bun.build({
    entrypoints: [filePath],
    minify: true,
    format: "esm",
    target: "browser",
    external: ["react", "react-dom", "vite"],
  });

  if (result.outputs.length > 0) {
    const minified = await result.outputs[0].text();
    await writeFile(filePath, minified);
  }
}

async function main() {
  const jsFiles = await getJsFiles(DIST_DIR);

  for (const file of jsFiles) {
    await minifyFile(file);
  }

  console.log(`Minified ${jsFiles.length} files`);
}

main().catch(console.error);

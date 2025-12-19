import { readFile } from "node:fs/promises";
import { brotliCompressSync, gzipSync } from "node:zlib";

const RUNTIME_FILES = [
  "dist/runtime/index.js",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function padEnd(str: string, len: number): string {
  return str + " ".repeat(Math.max(0, len - str.length));
}

function padStart(str: string, len: number): string {
  return " ".repeat(Math.max(0, len - str.length)) + str;
}

async function getFileSizes(
  filePath: string
): Promise<{ file: string; min: number; gzip: number; brotli: number }> {
  const content = await readFile(filePath);
  const gzipped = gzipSync(content, { level: 9 });
  const brotlied = brotliCompressSync(content);

  return {
    file: filePath.replace("dist/", ""),
    min: content.length,
    gzip: gzipped.length,
    brotli: brotlied.length,
  };
}

async function main() {
  const sizes = await Promise.all(RUNTIME_FILES.map(getFileSizes));

  const COL1 = 22;
  const COL2 = 10;
  const COL3 = 10;
  const COL4 = 10;

  console.log("\nRuntime File Sizes:");
  console.log(
    `┌${"─".repeat(COL1)}┬${"─".repeat(COL2)}┬${"─".repeat(COL3)}┬${"─".repeat(COL4)}┐`
  );
  console.log(
    `│${padEnd(" File", COL1)}│${padEnd(" Minified", COL2)}│${padEnd(" Gzip", COL3)}│${padEnd(" Brotli", COL4)}│`
  );
  console.log(
    `├${"─".repeat(COL1)}┼${"─".repeat(COL2)}┼${"─".repeat(COL3)}┼${"─".repeat(COL4)}┤`
  );

  for (const { file, min, gzip, brotli } of sizes) {
    console.log(
      `│${padEnd(" " + file, COL1)}│${padStart(formatBytes(min) + " ", COL2)}│${padStart(formatBytes(gzip) + " ", COL3)}│${padStart(formatBytes(brotli) + " ", COL4)}│`
    );
  }

  console.log(
    `└${"─".repeat(COL1)}┴${"─".repeat(COL2)}┴${"─".repeat(COL3)}┴${"─".repeat(COL4)}┘`
  );

  // Summary
  const totalMin = sizes.reduce((sum, s) => sum + s.min, 0);
  const totalGzip = sizes.reduce((sum, s) => sum + s.gzip, 0);
  const totalBrotli = sizes.reduce((sum, s) => sum + s.brotli, 0);

  console.log(
    `\nTotal runtime: ${formatBytes(totalMin)} minified, ${formatBytes(totalGzip)} gzip, ${formatBytes(totalBrotli)} brotli\n`
  );
}

main().catch(console.error);

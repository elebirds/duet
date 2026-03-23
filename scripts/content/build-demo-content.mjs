import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outDir = resolve(".duet/content");

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "README.txt"), "demo content cache\n");

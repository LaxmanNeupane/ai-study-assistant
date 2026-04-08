import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const outputDir = join(root, "public");

if (existsSync(outputDir)) {
  rmSync(outputDir, { recursive: true, force: true });
}

mkdirSync(outputDir, { recursive: true });

const copyIntoPublic = (source) => {
  cpSync(join(root, source), join(outputDir, source), { recursive: true });
};

copyIntoPublic("index.html");
copyIntoPublic("apps");
copyIntoPublic("packages");

console.log("Vercel build output prepared in ./public");

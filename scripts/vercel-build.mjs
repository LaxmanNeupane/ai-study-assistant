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

cpSync(join(root, "apps", "web", "index.html"), join(outputDir, "index.html"));
cpSync(join(root, "apps", "web", "src"), join(outputDir, "src"), { recursive: true });
copyIntoPublic("packages");

console.log("Vercel build output prepared in ./public");

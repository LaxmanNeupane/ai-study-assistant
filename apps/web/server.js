import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const rootDir = process.cwd();
const host = "127.0.0.1";
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const safeResolve = (requestPath) => {
  const normalizedPath = normalize(decodeURIComponent(requestPath)).replace(/^([/\\])+/, "");
  const absolutePath = join(rootDir, normalizedPath);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  return absolutePath;
};

const resolveRequestPath = (requestPath) => {
  const basePath = safeResolve(requestPath);

  if (!basePath) {
    return null;
  }

  if (!existsSync(basePath)) {
    return null;
  }

  if (statSync(basePath).isDirectory()) {
    const indexPath = join(basePath, "index.html");
    return existsSync(indexPath) ? indexPath : null;
  }

  return basePath;
};

createServer((request, response) => {
  const requestPath = new URL(request.url, `http://${request.headers.host}`).pathname;
  const absolutePath = resolveRequestPath(requestPath);

  if (!absolutePath) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes[extname(absolutePath)] ?? "application/octet-stream"
  });

  createReadStream(absolutePath).pipe(response);
}).listen(port, host, () => {
  console.log(`AI Study Notes Assistant is running at http://${host}:${port}/`);
});

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
  const normalizedPath = normalize(
    decodeURIComponent(requestPath === "/" ? "/apps/web/index.html" : requestPath)
  ).replace(/^([/\\])+/, "");
  const absolutePath = join(rootDir, normalizedPath);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  return absolutePath;
};

createServer((request, response) => {
  const absolutePath = safeResolve(new URL(request.url, `http://${request.headers.host}`).pathname);

  if (!absolutePath || !existsSync(absolutePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  if (statSync(absolutePath).isDirectory()) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Directory listing is disabled.");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes[extname(absolutePath)] ?? "application/octet-stream"
  });

  createReadStream(absolutePath).pipe(response);
}).listen(port, host, () => {
  console.log(`AI Study Notes Assistant is running at http://${host}:${port}/`);
});

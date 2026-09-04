import { createServer, request as proxyRequest } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

const rootDir = process.cwd();
const publicDir = resolve(rootDir, "artifacts/spmb-2027/dist/public");
const port = Number(process.env.PORT ?? 5000);
const apiPort = Number(process.env.INTERNAL_API_PORT ?? 8080);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT ?? ""}"`);
}

if (!Number.isInteger(apiPort) || apiPort <= 0 || apiPort === port) {
  throw new Error(`Invalid INTERNAL_API_PORT value: "${process.env.INTERNAL_API_PORT ?? ""}"`);
}

if (!existsSync(resolve(publicDir, "index.html"))) {
  throw new Error(`Frontend build not found at ${publicDir}. Run "pnpm run build" first.`);
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isWithinPublicDir(filePath) {
  const pathFromRoot = relative(publicDir, filePath);
  return pathFromRoot === "" || (!pathFromRoot.startsWith("..") && !pathFromRoot.split(sep).includes(".."));
}

function sendFile(filePath, response) {
  const contentType = mimeTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  response.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).on("error", () => {
    if (!response.headersSent) response.writeHead(500);
    response.end("Unable to read asset.");
  }).pipe(response);
}

function serveFrontend(request, response) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Invalid URL.");
    return;
  }

  const requestedFile = resolve(publicDir, `.${pathname}`);
  if (isWithinPublicDir(requestedFile) && existsSync(requestedFile) && statSync(requestedFile).isFile()) {
    sendFile(requestedFile, response);
    return;
  }

  if (extname(pathname)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found.");
    return;
  }

  sendFile(resolve(publicDir, "index.html"), response);
}

function proxyApi(request, response) {
  const upstream = proxyRequest(
    {
      hostname: "127.0.0.1",
      port: apiPort,
      path: request.url,
      method: request.method,
      headers: {
        ...request.headers,
        host: `127.0.0.1:${apiPort}`,
      },
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on("error", (error) => {
    console.error("API proxy error:", error.message);
    if (!response.headersSent) {
      response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    }
    response.end(JSON.stringify({ error: "API service is not ready." }));
  });

  request.pipe(upstream);
}

const apiProcess = spawn(
  process.execPath,
  ["--enable-source-maps", "artifacts/api-server/dist/index.mjs"],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(apiPort),
    },
    stdio: "inherit",
  },
);

const server = createServer((request, response) => {
  if ((request.url ?? "/").startsWith("/api/") || request.url === "/api") {
    proxyApi(request, response);
    return;
  }

  serveFrontend(request, response);
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down production services.`);
  server.close(() => apiProcess.kill("SIGTERM"));
  setTimeout(() => {
    apiProcess.kill("SIGKILL");
    process.exit(0);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

apiProcess.on("error", (error) => {
  console.error("Unable to start API service:", error);
  process.exitCode = 1;
});

apiProcess.on("exit", (code, signal) => {
  if (!shuttingDown && code !== 0) {
    console.error(`API service stopped unexpectedly (code=${code ?? "null"}, signal=${signal ?? "none"}).`);
    server.close();
    process.exitCode = 1;
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Production server listening on 0.0.0.0:${port}`);
  console.log(`Serving frontend from ${publicDir}`);
  console.log(`Proxying /api to 127.0.0.1:${apiPort}`);
});
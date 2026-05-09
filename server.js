import { createReadStream } from "node:fs";
import { mkdir, stat, appendFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 8080);
const maxBodyBytes = 10_000;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const serverEntry = fileURLToPath(import.meta.url);

const send = (response, status, body, type = "application/json; charset=utf-8") => {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  response.end(body);
};

const isInside = (parent, child) => {
  const relativePath = relative(parent, child);
  return relativePath === "" || (!relativePath.startsWith("..") && !relativePath.includes(`..${sep}`));
};

const hasHiddenSegment = (filePath) =>
  relative(root, filePath)
    .split(sep)
    .some((segment) => segment.startsWith("."));

const isPublicAsset = (filePath) => {
  const relativePath = relative(root, filePath);

  return (
    ["favicon.ico", "index.html", "privacy-policy.html", "script.js", "styles.css"].includes(relativePath) ||
    relativePath.startsWith(`assets${sep}`)
  );
};

const parseBody = async (request) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new Error("Body too large");
    }
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString("utf8");
  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(body);
  }

  return Object.fromEntries(new URLSearchParams(body));
};

const handleNotify = async (request, response, listPath) => {
  try {
    const payload = await parseBody(request);
    const email = String(payload.email || "").trim().toLowerCase();

    if (!emailPattern.test(email)) {
      send(response, 400, JSON.stringify({ ok: false, error: "Enter a valid email address." }));
      return;
    }

    const dataDir = resolve(listPath, "..");
    await mkdir(dataDir, { recursive: true });
    await appendFile(
      listPath,
      `${JSON.stringify({ email, createdAt: new Date().toISOString() })}\n`,
      "utf8",
    );

    send(response, 200, JSON.stringify({ ok: true }));
  } catch {
    send(response, 500, JSON.stringify({ ok: false, error: "Could not save your email right now." }));
  }
};

const serveStatic = async (request, response, protectedDir) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = resolve(root, `.${pathname}`);

  if (!isInside(root, filePath) || hasHiddenSegment(filePath) || isInside(protectedDir, filePath)) {
    send(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  if (!isPublicAsset(filePath)) {
    send(response, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      throw new Error("Not a file");
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    send(response, 404, "Not found", "text/plain; charset=utf-8");
  }
};

export const createAppServer = ({
  notifyDataDir = process.env.NOTIFY_DATA_DIR || join(root, ".notify-data"),
} = {}) => {
  const protectedDir = resolve(notifyDataDir);
  const listPath = join(protectedDir, "notify-list.jsonl");

  return createServer(async (request, response) => {
    if (request.method === "POST" && request.url?.startsWith("/api/notify")) {
      await handleNotify(request, response, listPath);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(request, response, protectedDir);
      return;
    }

    send(response, 405, "Method not allowed", "text/plain; charset=utf-8");
  });
};

if (process.argv[1] === serverEntry) {
  const notifyDataDir = process.env.NOTIFY_DATA_DIR || join(root, ".notify-data");
  const listPath = join(resolve(notifyDataDir), "notify-list.jsonl");

  createAppServer({ notifyDataDir }).listen(port, () => {
    console.log(`Daily Oath site listening on http://localhost:${port}`);
    console.log(`Notification signups will be saved to ${listPath}`);
  });
}

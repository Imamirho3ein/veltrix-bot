import { createServer } from "node:http";
import { env } from "./config.js";

/**
 * Optional HTTP health endpoint.
 *
 * Only starts when PORT is set (Render, Railway, Fly web services, …).
 * Long polling itself needs no inbound port, but platforms that require a
 * bound port want a fast 200 response on a health path.
 */
export function startHealthServer(): void {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port <= 0) return;

  const startedAt = Date.now();
  const server = createServer((request, response) => {
    const url = (request.url ?? "/").split("?")[0];
    if (request.method === "GET" && (url === "/" || url === "/health")) {
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(
        JSON.stringify({
          ok: true,
          brand: env.brandName,
          uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        }),
      );
      return;
    }
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("not found");
  });

  server.on("error", (error) => {
    console.warn("[bot] health server error", error);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[bot] health server listening on :${port}`);
  });
}

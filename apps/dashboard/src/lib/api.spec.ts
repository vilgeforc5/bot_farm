import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { apiFetch } from "./api";
import type { StoredAuth } from "./auth";

let server: Server;
let auth: StoredAuth;

describe("apiFetch", () => {
  beforeAll(async () => {
    server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");

      if (url.pathname === "/api/admin/db/summary" && request.method === "POST") {
        if (request.headers.authorization !== "Basic b3BlcmF0b3I6c2VjcmV0") {
          response.writeHead(401, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: "Missing auth header" }));
          return;
        }

        if (request.headers["x-trace-id"] !== "trace-1") {
          response.writeHead(400, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: "Missing trace header" }));
          return;
        }

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true, items: [1, 2, 3] }));
        return;
      }

      if (url.pathname === "/api/admin/session") {
        response.writeHead(401, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Bad credentials" }));
        return;
      }

      if (url.pathname === "/api/admin/db/failure") {
        response.writeHead(502, { "Content-Type": "text/plain" });
        response.end("gateway exploded");
        return;
      }

      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("not found");
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Server did not bind to a numeric port");
    }

    auth = {
      serverUrl: `http://127.0.0.1:${address.port}`,
      username: "operator",
      password: "secret"
    };
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it("sends json requests with a basic auth header and returns parsed data", async () => {
    await expect(apiFetch<{ ok: boolean; items: number[] }>(auth, "/api/admin/db/summary", {
      method: "POST",
      headers: { "X-Trace-Id": "trace-1" },
      body: JSON.stringify({ ping: true })
    })).resolves.toEqual({ ok: true, items: [1, 2, 3] });
  });

  it("throws the server error message when the response contains one", async () => {
    await expect(apiFetch(auth, "/api/admin/session")).rejects.toThrow("Bad credentials");
  });

  it("falls back to the status code when the error body is not json", async () => {
    await expect(apiFetch(auth, "/api/admin/db/failure")).rejects.toThrow("Request failed with 502");
  });
});

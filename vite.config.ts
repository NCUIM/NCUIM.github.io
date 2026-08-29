import { configDefaults, defineConfig, type Plugin } from "vitest/config";
import type { ViteDevServer, Connect } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import react from "@vitejs/plugin-react";
import https from "https";
import fs from "fs";
import path from "path";

/**
 * Vite plugin that adds /ncu/cis/validate endpoint.
 * Server-side: fetches CIS sheets.xml with the user's JSESSIONID,
 * then returns 200 (valid) or 302/JS-redirect (invalid).
 * This avoids browser CORS + opaque-redirect issues.
 */
const cisValidatePlugin = (): Plugin => ({
  name: "cis-validate",
  configureServer(server: ViteDevServer) {
    server.middlewares.use("/ncu/cis/validate", (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
      const queryId = url.searchParams.get("jsessionid") ?? "";
      const cookieHeader = req.headers.cookie ?? "";
      const jsessionidMatch = cookieHeader.match(/JSESSIONID=([^;]+)/);
      const sessionId = queryId || (jsessionidMatch ? jsessionidMatch[1].trim() : "");
      if (!sessionId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ valid: false, error: "No JSESSIONID" }));
        return;
      }

      const cisReq = https.get(
        "https://cis.ncu.edu.tw/Course/main/support/sheets.xml",
        {
          headers: {
            Cookie: `JSESSIONID=${sessionId}`,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          },
        },
        (cisRes) => {
          if (cisRes.statusCode === 301 || cisRes.statusCode === 302) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                valid: false,
                error: `Session 無效 (HTTP ${cisRes.statusCode})`,
                debug: { status: cisRes.statusCode, location: cisRes.headers.location },
              }),
            );
            cisRes.resume();
            return;
          }
          let body = "";
          cisRes.on("data", (chunk: Buffer) => {
            body += chunk.toString();
          });
          cisRes.on("end", () => {
            const isJsRedirect = body.includes("window.location");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                valid: !isJsRedirect,
                debug: { bodyLength: body.length, isJsRedirect, snippet: body.substring(0, 300) },
              }),
            );
          });
        },
      );
      cisReq.on("error", (err) => {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ valid: false, error: err.message }));
      });
    });
  },
});

/**
 * Vite plugin that generates a 404.html copy of index.html in dist/
 * to ensure SPA client-side routing works on GitHub Pages refreshes.
 */
const spa404Plugin = (): Plugin => ({
  name: "spa-404-fallback",
  closeBundle() {
    const distDir = path.resolve(__dirname, "dist");
    const indexPath = path.join(distDir, "index.html");
    const notFoundPath = path.join(distDir, "404.html");
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, notFoundPath);
    }
  },
});

export default defineConfig({
  base:
    process.env.GITHUB_PAGES === "true" || process.env.GITHUB_ACTIONS
      ? "/NCUIM2026-Fresher/"
      : "/",
  plugins: [react(), cisValidatePlugin(), spa404Plugin()],
  envPrefix: ["VITE_", "FIREBASE_"],
  server: {
    proxy: {
      // Proxy the NCU OAuth token exchange through the dev server to
      // bypass CORS restrictions on portal.ncu.edu.tw (no ACAO header).
      "/ncu/token": {
        target: "https://portal.ncu.edu.tw",
        changeOrigin: true,
        rewrite: () => "/oauth2/token",
      },

      // Proxy NCU CIS (Course Schedule Planning System)
      "/ncu/cis": {
        target: "https://cis.ncu.edu.tw",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ncu\/cis/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            const session =
              proxyReq.getHeader("x-cis-session") ||
              proxyReq.getHeader("X-CIS-Session");
            if (session) {
              proxyReq.setHeader("Cookie", `JSESSIONID=${session}`);
              proxyReq.removeHeader("x-cis-session");
              proxyReq.removeHeader("X-CIS-Session");
            }
          });
          proxy.on("proxyRes", (proxyRes) => {
            const loc = proxyRes.headers.location;
            if (!loc) return;
            let newPath: string | null = null;
            if (loc.startsWith("/")) {
              newPath = `/ncu/cis${loc}`;
            } else if (loc.includes("cis.ncu.edu.tw")) {
              try {
                newPath = `/ncu/cis${new URL(loc).pathname}`;
              } catch {
                // ignore malformed URLs
              }
            }
            if (newPath) {
              proxyRes.headers.location = newPath;
            }
          });
        },
      },
      // Proxy NCU Portal APIs (user info, etc.)
      "/ncu/portal": {
        target: "https://portal.ncu.edu.tw",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ncu\/portal/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("firebase")) return "firebase-vendor";
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    exclude: [...configDefaults.exclude, "tests/e2e/**", "functions/**"],
    setupFiles: "./src/test/setup.ts",
  },
});

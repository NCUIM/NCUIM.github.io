import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import https from "https";

/**
 * Vite plugin that adds /ncu/cis/validate endpoint.
 * Server-side: fetches CIS sheets.xml with the user's JSESSIONID,
 * then returns 200 (valid) or 302/JS-redirect (invalid).
 * This avoids browser CORS + opaque-redirect issues.
 */
function cisValidatePlugin() {
  return {
    name: "cis-validate",
    configureServer(server: any) {
      server.middlewares.use("/ncu/cis/validate", (req: any, res: any) => {
        // Accept JSESSIONID from query param (primary) or Cookie header (fallback)
        const url = new URL(req.url || "/", `http://${req.headers.host}`);
        const queryId = url.searchParams.get("jsessionid") || "";
        const cookieHeader = req.headers["cookie"] || "";
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
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
          },
          (cisRes) => {
            console.log("[CIS] status=", cisRes.statusCode);
            console.log("[CIS] set-cookie=", cisRes.headers["set-cookie"]);
            // 302/301 redirect = invalid session
            if (cisRes.statusCode === 301 || cisRes.statusCode === 302) {
              console.log("[CIS] REDIRECT to", cisRes.headers["location"]);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ valid: false, error: `Session 無效 (HTTP ${cisRes.statusCode})`, debug: { status: cisRes.statusCode, location: cisRes.headers["location"] } }));
              cisRes.resume();
              return;
            }
            // Collect body to check for JS redirect page
            let body = "";
            cisRes.on("data", (chunk: Buffer) => { body += chunk.toString(); });
            cisRes.on("end", () => {
              const isJsRedirect = body.includes("window.location");
              console.log("[CIS] body.length=", body.length, "isJsRedirect=", isJsRedirect);
              console.log("[CIS] body (first 500)=", body.substring(0, 500));
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ valid: !isJsRedirect, debug: { bodyLength: body.length, isJsRedirect, snippet: body.substring(0, 300) } }));
            });
          },
        );
        cisReq.on("error", (err) => {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ valid: false, error: err.message }));
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), cisValidatePlugin()],
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
      // CIS returns redirects with Location headers that must be rewritten
      // to stay within the proxy path.
      "/ncu/cis": {
        target: "https://cis.ncu.edu.tw",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ncu\/cis/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Rewrite X-CIS-Session custom header → Cookie header
            // (browsers strip manual Cookie headers from fetch)
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
            const loc = proxyRes.headers["location"];
            if (!loc) return;
            let newPath: string | null = null;
            if (loc.startsWith("/")) {
              newPath = "/ncu/cis" + loc;
            } else if (loc.includes("cis.ncu.edu.tw")) {
              try {
                newPath = "/ncu/cis" + new URL(loc).pathname;
              } catch {
                // ignore malformed URLs
              }
            }
            if (newPath) {
              proxyRes.headers["location"] = newPath;
            }
          });
        },
      },
      // Proxy NCU Portal APIs (user info, etc.)
      "/ncu/portal": {
        target: "https://portal.ncu.edu.tw",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ncu\/portal/, ""),
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
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/test/**", "src/vite-env.d.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});

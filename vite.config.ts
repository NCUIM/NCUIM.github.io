import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "FIREBASE_"],
  build: {
    rollupOptions: {
      output: {
        // Split vendored libraries into their own chunks so the app entry
        // stays under Vite's 500 kB warning threshold and unchanged vendors
        // are cached by browsers across deploys.
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

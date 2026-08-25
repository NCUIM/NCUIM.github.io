#!/usr/bin/env node
/**
 * scripts/install-hooks.mjs
 *
 * Installs the version-controlled git hooks from scripts/hooks/ into
 * .git/hooks/. Runs automatically via the `prepare` npm script on every
 * `npm install`, so every checkout gets the same local enforcement.
 *
 * Manual re-install: `npm run prepare`.
 */

import { chmodSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hooksDir = join(root, ".git", "hooks");
const hookNames = ["commit-msg", "pre-commit"];

for (const name of hookNames) {
  const source = join(root, "scripts", "hooks", name);
  const target = join(hooksDir, name);
  mkdirSync(hooksDir, { recursive: true });
  copyFileSync(source, target);
  try {
    chmodSync(target, 0o755);
  } catch {
    // Windows: chmod is a no-op; Git for Windows still runs the hook via sh.
  }
  console.log(`Installed hook: .git/hooks/${name} (from scripts/hooks/${name})`);
}

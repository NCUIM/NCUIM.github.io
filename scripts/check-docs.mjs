#!/usr/bin/env node
/**
 * scripts/check-docs.mjs
 *
 * Repository documentation integrity checks, run locally (`npm run test:docs`)
 * and in CI (.github/workflows/policy.yml):
 *
 *  1. Link check — every relative markdown link must resolve to an existing
 *     file or directory in the repository.
 *  2. Single-source check — the commit/PR policy and the testing policy must
 *     live ONLY in their canonical files. No other file may embed a copy of
 *     the rule values; that is exactly how the rules drifted apart before.
 *
 * Exit code 0 = pass, 1 = failure.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "tmp",
  ".vite",
  ".freebuff",
  ".firebase",
  "test-results",
  "playwright-report",
  ".turbo",
]);

// ---------------------------------------------------------------------------
// Walking
// ---------------------------------------------------------------------------

function walk(dir) {
  const files = [];
  let entries = null;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Check 1: relative markdown links resolve
// ---------------------------------------------------------------------------

const LINK_RE = /\[[^\[\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function isFenceLine(trimmed) {
  return /^(```|~~~)/.test(trimmed);
}

// Same-file anchors, autolinks, and external URLs are out of scope.
function isOutOfScopeTarget(target) {
  return target.startsWith("#") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target);
}

function cleanLinkTarget(target) {
  const raw = target.split(/[#?]/)[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    // Not valid percent-encoding; keep the raw target.
    return raw;
  }
}

function checkLinksInLine(file, line, lineNo, errors) {
  LINK_RE.lastIndex = 0;
  for (let match = LINK_RE.exec(line); match !== null; match = LINK_RE.exec(line)) {
    const target = match[1];
    if (isOutOfScopeTarget(target)) continue;
    const clean = cleanLinkTarget(target);
    if (!clean) continue;

    const resolved = resolve(dirname(file), clean);
    if (!existsSync(resolved)) {
      errors.push(
        `${relative(root, file).replaceAll("\\", "/")}:${lineNo}: broken link -> ${target}`,
      );
    }
  }
}

function checkFileLinks(file, errors) {
  const lines = readFileSync(file, "utf8").split("\n");
  let inFence = false;
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const isFence = isFenceLine(trimmed);
    const isCommentStart = trimmed.startsWith("<!--");
    const isCommentEnd = trimmed.includes("-->");

    if (isFence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (isCommentStart) inComment = true;
    if (inComment) {
      if (isCommentEnd) inComment = false;
      continue;
    }

    checkLinksInLine(file, lines[i], i + 1, errors);
  }
}

export function checkLinks(mdFiles) {
  const errors = [];
  for (const file of mdFiles) {
    checkFileLinks(file, errors);
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Check 2: policy rule values live only in their canonical files
// ---------------------------------------------------------------------------

const COMMIT_POLICY_FILES = new Set([
  "scripts/commit-policy.mjs",
  "docs/engineering/commit-policy.md",
]);

const TESTING_POLICY_FILES = new Set(["docs/engineering/testing-policy.md"]);

const FORBIDDEN = [
  {
    name: "commit policy",
    canonical: COMMIT_POLICY_FILES,
    patterns: [
      /Allowed types:/,
      /feat, fix, refactor, docs, test, chore, style, perf, security/,
      /feat, fix, docs, style, refactor, test, chore/,
      /numbered list in English/,
      /at most 72 characters/,
      /under 72 characters/,
    ],
  },
  {
    name: "testing policy",
    canonical: TESTING_POLICY_FILES,
    patterns: [
      /Acceptance cases before implementation/,
      /Acceptance tests or explicit manual cases/,
      /Automated shape\/content checks/,
      /Policy tests or SQL verification/,
      /Fixture-based tests for duplicates and drafts/,
      /Build plus browser smoke test/,
      /Ownership, retention, and export exclusion checks/,
    ],
  },
];

export function checkSingleSource(files) {
  const errors = [];
  const textFiles = files.filter((f) => /\.(md|txt|yml|yaml)$/.test(f));

  for (const file of textFiles) {
    const rel = relative(root, file).replaceAll("\\", "/");
    const content = readFileSync(file, "utf8");

    for (const rule of FORBIDDEN) {
      if (rule.canonical.has(rel)) continue;
      for (const pattern of rule.patterns) {
        if (pattern.test(content)) {
          errors.push(
            `${rel}: embeds ${rule.name} rule text (/${pattern.source}/). ` +
              "Keep rule values only in the canonical files.",
          );
        }
      }
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const files = walk(root);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  const errors = [
    ...checkLinks(mdFiles),
    ...checkSingleSource(files),
  ];

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[DOC CHECK FAILED] ${error}`);
    }
    console.error(`${errors.length} problem(s) found.`);
    process.exit(1);
  }
  console.log(`OK — ${mdFiles.length} markdown files checked, links resolve, policies are single-source.`);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

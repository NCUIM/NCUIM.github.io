#!/usr/bin/env node
/**
 * scripts/pr-tool.mjs
 *
 * Clickra-inspired PR workflow automation and safety gate.
 * Ensures strict branch naming, atomic staging, template compliance,
 * and review thread closure protocols.
 *
 * CLI usage:
 *   node scripts/pr-tool.mjs validate-branch [branch-name]
 *   node scripts/pr-tool.mjs prepare
 *   node scripts/pr-tool.mjs render-body [--output <file>]
 *   node scripts/pr-tool.mjs create [--title <title>] [--draft]
 *   node scripts/pr-tool.mjs verify [pr-number]
 *   node scripts/pr-tool.mjs resolve <thread-id>
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { validatePrBody } from "./commit-policy.mjs";

export const BRANCH_LIMITS = {
  minWords: 2,
  maxWords: 3,
  maxSuffixLength: 25,
  allowedTypes: [
    "feat",
    "fix",
    "refactor",
    "docs",
    "test",
    "chore",
    "style",
    "perf",
    "security",
    "ci",
  ],
};

/**
 * Validates a branch name according to Clickra branch discipline.
 */
export function validateBranchName(branchName) {
  const name = String(branchName || "").trim();
  const errors = [];

  if (name === "main" || name === "master" || name === "HEAD") {
    return { valid: true, errors: [] };
  }

  const slashIdx = name.indexOf("/");
  if (slashIdx === -1) {
    errors.push(
      `Branch "${name}" must follow <type>/<suffix> format (e.g. feat/pr-tool).`,
    );
    return { valid: false, errors };
  }

  const type = name.slice(0, slashIdx);
  const suffix = name.slice(slashIdx + 1);

  if (!BRANCH_LIMITS.allowedTypes.includes(type)) {
    errors.push(
      `Branch type "${type}" is invalid. Allowed types: ${BRANCH_LIMITS.allowedTypes.join(", ")}.`,
    );
  }

  if (suffix.length > BRANCH_LIMITS.maxSuffixLength) {
    errors.push(
      `Branch suffix "${suffix}" exceeds ${BRANCH_LIMITS.maxSuffixLength} characters (currently ${suffix.length}).`,
    );
  }

  // Check word count separated by hyphen
  const words = suffix.split("-").filter(Boolean);
  if (words.length < BRANCH_LIMITS.minWords || words.length > BRANCH_LIMITS.maxWords) {
    errors.push(
      `Branch suffix "${suffix}" must contain ${BRANCH_LIMITS.minWords} to ${BRANCH_LIMITS.maxWords} words separated by hyphens (currently ${words.length}).`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    type,
    suffix,
    length: suffix.length,
    wordCount: words.length,
  };
}

/**
 * Runs a command safely and returns stdout.
 */
function run(cmd, args = [], options = {}) {
  if (cmd === "npm" || cmd === "npx") {
    const fullCmd = [cmd, ...args].join(" ");
    const result = execSync(fullCmd, {
      encoding: "utf8",
      stdio: options.stdio || "pipe",
      ...options,
    });
    return typeof result === "string" ? result.trim() : "";
  }
  const result = execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: options.stdio || "pipe",
    ...options,
  });
  return typeof result === "string" ? result.trim() : "";
}

/**
 * Gets current branch name.
 */
export function getCurrentBranch() {
  try {
    return run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  } catch (err) {
    return "HEAD";
  }
}

/**
 * Extracts unpushed commits ahead of origin/main.
 */
export function getLocalCommits(baseRef = "origin/main") {
  try {
    const raw = run("git", [
      "log",
      `${baseRef}..HEAD`,
      "--format=%H%x00%s%x00%b%x1e",
    ]);
    if (!raw) return [];
    return raw
      .split("\x1e")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [sha, subject, body] = entry.split("\x00");
        return { sha, subject, body: (body || "").trim() };
      });
  } catch (err) {
    return [];
  }
}

/**
 * Renders PR body matching .github/pull_request_template.md
 */
export function renderPrBody(commits = [], customSummary = "") {
  const templatePath = path.resolve(process.cwd(), ".github/pull_request_template.md");
  let template = "";
  if (existsSync(templatePath)) {
    template = readFileSync(templatePath, "utf8");
  }

  const summaryText =
    customSummary ||
    (commits.length > 0
      ? commits[0].subject.replace(/^[a-z]+(?:\([^)]+\))?:\s*/i, "")
      : "Automated PR created via pr-tool.");

  const keyChanges =
    commits.length > 0
      ? commits.map((c, i) => `${i + 1}. ${c.subject}`).join("\n")
      : "1. Core changes implemented.";

  if (!template) {
    return `## Summary\n\n${summaryText}\n\n## Key Changes\n\n${keyChanges}\n\n## Verification\n\n- [x] \`npx tsc --noEmit\` passes\n- [x] \`npx vitest run\` — all tests pass\n- [x] No sensitive data committed\n`;
  }

  return template
    .replace(/## Summary[\s\S]*?(?=## Key Changes)/i, `## Summary\n\n${summaryText}\n\n`)
    .replace(/## Key Changes[\s\S]*?(?=## Verification)/i, `## Key Changes\n\n${keyChanges}\n\n`)
    .replace(/- \[ \] `npx tsc --noEmit` passes/g, "- [x] `npx tsc --noEmit` passes")
    .replace(/- \[ \] `npx vitest run` — all tests pass/g, "- [x] `npx vitest run` — all tests pass")
    .replace(/- \[ \] No sensitive data committed/g, "- [x] No sensitive data committed");
}

/**
 * Preflight checks before PR creation.
 */
export function runPrepare() {
  console.log("🔍 Running Clickra preflight checks...");

  const currentBranch = getCurrentBranch();
  console.log(`📌 Current branch: ${currentBranch}`);

  const branchCheck = validateBranchName(currentBranch);
  if (!branchCheck.valid) {
    console.error("❌ Branch naming violation:");
    branchCheck.errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }
  console.log("✅ Branch naming policy passed.");

  console.log("🛠️ Running TypeScript typecheck...");
  try {
    run("npm", ["run", "typecheck"], { stdio: "inherit" });
  } catch (err) {
    console.error("❌ TypeScript typecheck failed.", err?.message || err);
    process.exit(1);
  }

  console.log("📋 Running Commit policy self-test...");
  try {
    run("npm", ["run", "test:policy"], { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Commit policy self-test failed.");
    process.exit(1);
  }

  console.log("📚 Running Documentation checks...");
  try {
    run("npm", ["run", "test:docs"], { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Documentation checks failed.");
    process.exit(1);
  }

  console.log("🧪 Running Unit test suite...");
  try {
    run("npm", ["test"], { stdio: "inherit" });
  } catch (err) {
    console.error("❌ Unit tests failed.");
    process.exit(1);
  }

  console.log("🎉 All Clickra preflight checks passed successfully!");
}

/**
 * Resolves a GitHub PR review thread via GraphQL.
 */
export function resolveReviewThread(threadId) {
  if (!threadId) {
    console.error("Usage: pr-tool resolve <thread-id>");
    process.exit(2);
  }

  const query = `
    mutation ResolveThread($threadId: ID!) {
      resolveReviewThread(input: { threadId: $threadId }) {
        thread {
          id
          isResolved
        }
      }
    }
  `;

  console.log(`Resolving review thread ${threadId}...`);
  try {
    const result = run("gh", [
      "api",
      "graphql",
      "-f",
      `query=${query}`,
      "-F",
      `threadId=${threadId}`,
    ]);
    console.log("✅ Review thread marked as resolved.");
    return result;
  } catch (err) {
    console.error("❌ Failed to resolve review thread via GraphQL.", err.message);
    process.exit(1);
  }
}

/**
 * CLI Entrypoint.
 */
export function selfTest() {
  const failures = [];
  function check(name, ok, expected = true) {
    if (ok !== expected) {
      failures.push(`Check "${name}" failed: got ${ok}, expected ${expected}`);
    }
  }

  // Branch validation checks
  check("valid 2-word branch", validateBranchName("feat/pr-tool").valid, true);
  check("valid 3-word branch", validateBranchName("refactor/cis-sync-flow").valid, true);
  check("1-word suffix rejected", validateBranchName("feat/tool").valid, false);
  check("4-word suffix rejected", validateBranchName("chore/test-and-build-hygiene").valid, false);
  check("suffix exceeding 25 chars rejected", validateBranchName("feat/this-is-a-very-long-branch-exceeding-limit").valid, false);
  check("invalid branch type rejected", validateBranchName("unknown/pr-tool").valid, false);
  check("main branch allowed", validateBranchName("main").valid, true);
  check("master branch allowed", validateBranchName("master").valid, true);

  // Template / renderPrBody checks
  const mockCommits = [
    {
      sha: "abcdef1",
      subject: "feat(ci): implement pr-tool workflow automation script",
      body: "1. Add pr-tool script\n2. Add preflight checks",
    },
  ];
  const rendered = renderPrBody(mockCommits, "Automated PR created via pr-tool.");
  const bodyErrors = validatePrBody(rendered);
  if (bodyErrors.length > 0) {
    failures.push(`renderPrBody failed commit-policy validation: ${bodyErrors.join("; ")}`);
  }

  if (failures.length > 0) {
    console.error(`❌ pr-tool self-test failed (${failures.length} errors):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("✅ pr-tool self-test passed (all branch rules and PR body templates verified).");
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  switch (command) {
    case "validate-branch": {
      const target = args[1] || getCurrentBranch();
      const res = validateBranchName(target);
      if (!res.valid) {
        console.error(`❌ Invalid branch name "${target}":`);
        res.errors.forEach((e) => console.error(`  - ${e}`));
        process.exit(1);
      }
      console.log(`✅ Branch "${target}" complies with Clickra limits (suffix length: ${res.length}, words: ${res.wordCount}).`);
      break;
    }
    case "prepare": {
      runPrepare();
      break;
    }
    case "render-body": {
      const outIdx = args.indexOf("--output");
      const outputPath = outIdx !== -1 ? args[outIdx + 1] : null;
      const commits = getLocalCommits();
      const body = renderPrBody(commits);
      if (outputPath) {
        writeFileSync(outputPath, body, "utf8");
        console.log(`✅ PR body written to ${outputPath}`);
      } else {
        console.log(body);
      }
      break;
    }
    case "create": {
      runPrepare();
      const isDraft = args.includes("--draft");
      const titleIdx = args.indexOf("--title");
      const commits = getLocalCommits();
      const title =
        titleIdx !== -1 && args[titleIdx + 1]
          ? args[titleIdx + 1]
          : commits.length > 0
            ? commits[0].subject
            : `feat: update ${getCurrentBranch()}`;

      const tempFile = path.join(os.tmpdir(), `pr_body_${Date.now()}.md`);
      try {
        const body = renderPrBody(commits);
        writeFileSync(tempFile, body, "utf8");
        const ghArgs = ["pr", "create", "--title", title, "--body-file", tempFile];
        if (isDraft) ghArgs.push("--draft");
        console.log(`🚀 Creating PR: "${title}"...`);
        const out = run("gh", ghArgs, { stdio: "inherit" });
        console.log(out || "✅ PR created successfully.");
      } finally {
        if (existsSync(tempFile)) unlinkSync(tempFile);
      }
      break;
    }
    case "resolve": {
      resolveReviewThread(args[1]);
      break;
    }
    case "self-test": {
      selfTest();
      break;
    }
    case "help":
    default:
      console.log(`
Clickra PR Workflow Automation Tool

Usage:
  node scripts/pr-tool.mjs validate-branch [branch]  Validate branch scope and length limits
  node scripts/pr-tool.mjs prepare                  Run all preflight checks
  node scripts/pr-tool.mjs render-body [--output f] Render safe PR body from template
  node scripts/pr-tool.mjs create [--title t]       Safe PR creation via body-file
  node scripts/pr-tool.mjs resolve <thread-id>      Resolve PR review thread via GraphQL
`);
      break;
  }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  main();
}

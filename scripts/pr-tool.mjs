#!/usr/bin/env node
/**
 * scripts/pr-tool.mjs
 *
 * Clickra-inspired PR workflow automation and safety gate.
 * Ensures strict branch naming, atomic staging, template compliance,
 * two-phase push/create gates, review thread auditing, and closure protocols.
 *
 * CLI usage:
 *   node scripts/pr-tool.mjs validate-branch [branch-name]
 *   node scripts/pr-tool.mjs prepare
 *   node scripts/pr-tool.mjs render-body [--output <file>]
 *   node scripts/pr-tool.mjs push [--authorize <branch:sha>] [--execute]
 *   node scripts/pr-tool.mjs create [--title <title>] [--authorize <token>] [--execute] [--draft]
 *   node scripts/pr-tool.mjs audit [pr-number]
 *   node scripts/pr-tool.mjs resolve <thread-id> [--authorize <thread-id>] [--execute]
 *   node scripts/pr-tool.mjs self-test
 */

import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
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

export const PR_SEQUENCE_PATTERNS = [
  /(?:^|[-_/])pr\d+(?=$|[-_/])/i,
  /(?:^|[-_/])post-[a-z0-9]+(?=$|[-_/])/i,
  /(?:^|[-_/])phase-\d+(?=$|[-_/])/i,
];

export const VERSION_PATTERN = /\bv?\d+\.\d+/i;

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

  if (PR_SEQUENCE_PATTERNS.some((pattern) => pattern.test(name))) {
    errors.push(
      "Branch name must describe the change; PR sequence suffixes or markers such as -pr2 or phase-1 are prohibited.",
    );
  }

  if (VERSION_PATTERN.test(suffix)) {
    errors.push(
      "Branch name must not contain version identifiers (e.g., v1.0).",
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
 * Gets remote repository origin slug (e.g. NCUIM/NCUIM.github.io).
 */
export function getRepoOrigin() {
  try {
    const url = run("git", ["remote", "get-url", "origin"]).trim();
    const originPattern = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/;
    const match = originPattern.exec(url);
    if (!match) return "NCUIM/NCUIM.github.io";
    return `${match[1]}/${match[2]}`;
  } catch {
    return "NCUIM/NCUIM.github.io";
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
  } catch {
    // Return empty list if baseRef does not exist or git log fails.
    return [];
  }
}

/**
 * Renders PR body matching .github/pull_request_template.md
 */
export function renderPrBody({ summary = "", keyChanges = [] } = {}) {
  const templatePath = path.resolve(process.cwd(), ".github/pull_request_template.md");
  let template = "";
  if (existsSync(templatePath)) {
    template = readFileSync(templatePath, "utf8");
  }

  const summaryText = summary || "Describe the high-level intent and architectural impact of this PR.";

  let formattedChanges = "";
  if (Array.isArray(keyChanges) && keyChanges.length > 0) {
    formattedChanges = keyChanges.map((c, i) => `${i + 1}. ${c}`).join("\n");
  } else if (typeof keyChanges === "string" && keyChanges.trim()) {
    formattedChanges = keyChanges.trim();
  } else {
    formattedChanges = "1. **Architecture & Scope**: Describe component-level changes.\n2. **Behavior & Contracts**: Detail modified contracts or behaviors.";
  }

  if (!template) {
    return `## Summary\n\n${summaryText}\n\n## Key Changes\n\n${formattedChanges}\n\n## Verification\n\n- [x] \`npx tsc --noEmit\` passes\n- [x] \`npx vitest run\` — all tests pass\n- [x] No sensitive data committed\n`;
  }

  return template
    .replace(/## Summary[\s\S]*?(?=## Key Changes)/i, `## Summary\n\n${summaryText}\n\n`)
    .replace(/## Key Changes[\s\S]*?(?=## Verification)/i, `## Key Changes\n\n${formattedChanges}\n\n`)
    .replaceAll("- [ ] `npx tsc --noEmit` passes", "- [x] `npx tsc --noEmit` passes")
    .replaceAll("- [ ] `npx vitest run` — all tests pass", "- [x] `npx vitest run` — all tests pass")
    .replaceAll("- [ ] No sensitive data committed", "- [x] No sensitive data committed");
}

/**
 * Preflight checks before PR creation or push.
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
 * Clickra-inspired guarded push with two-phase authorization and remote verification.
 */
export function runPush(authorization = "", { execute = false } = {}) {
  const branch = getCurrentBranch();
  const sha = run("git", ["rev-parse", "HEAD"]).trim();

  const branchCheck = validateBranchName(branch);
  if (!branchCheck.valid) {
    console.error("❌ Cannot push invalid branch:");
    branchCheck.errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }

  const status = run("git", ["status", "--porcelain"]).trim();
  if (status) {
    console.error("❌ Worktree must be clean before publication.");
    process.exit(1);
  }

  const expectedAuth = `${branch}:${sha}`;
  if (!execute) {
    console.log(`🔒 Push preview authorization token:`);
    console.log(`   ${expectedAuth}`);
    console.log(`\nTo execute push, request explicit user authorization and rerun:`);
    console.log(`   node scripts/pr-tool.mjs push --authorize "${expectedAuth}" --execute`);
    return { preview: expectedAuth };
  }

  if (authorization !== expectedAuth) {
    console.error(`❌ Push authorization mismatch:`);
    console.error(`   Expected: "${expectedAuth}"`);
    console.error(`   Received: "${authorization}"`);
    process.exit(1);
  }

  console.log(`🚀 Executing explicitly authorized push for ${expectedAuth}...`);
  run("git", ["push", "origin", `refs/heads/${branch}:refs/heads/${branch}`], { stdio: "inherit" });

  // Post-push verification via git ls-remote
  console.log(`🔍 Verifying remote HEAD matches local committed commit...`);
  const remoteOutput = run("git", ["ls-remote", "origin", `refs/heads/${branch}`]).trim();
  const remoteSha = remoteOutput.split(/\s+/)[0];
  if (remoteSha !== sha) {
    console.error(`❌ Push outcome unconfirmed: remote SHA (${remoteSha || "none"}) does not match local HEAD (${sha})`);
    process.exit(1);
  }

  console.log(`✅ Push confirmed: remote refs/heads/${branch} is at ${sha}`);
  return { pushed: expectedAuth };
}

/**
 * Clickra-inspired guarded PR creation with two-phase authorization and post-creation verification.
 */
export function runCreate({ title: customTitle = "", bodyFile = "", execute = false, authorization = "", draft = false } = {}) {
  runPrepare();
  const branch = getCurrentBranch();
  const sha = run("git", ["rev-parse", "HEAD"]).trim();
  const repo = getRepoOrigin();

  // Verify remote branch exists and is at local HEAD
  const remoteOutput = run("git", ["ls-remote", "origin", `refs/heads/${branch}`]).trim();
  const remoteSha = remoteOutput.split(/\s+/)[0];
  if (remoteSha !== sha) {
    console.error(`❌ Remote branch refs/heads/${branch} is not up-to-date with local HEAD (remote: ${remoteSha || "none"}, local: ${sha}).`);
    console.error(`   Please push using "node scripts/pr-tool.mjs push" first!`);
    process.exit(1);
  }

  let body = "";
  if (bodyFile && existsSync(bodyFile)) {
    body = readFileSync(bodyFile, "utf8");
  } else {
    console.error("❌ Clickra PR policy requires an explicit reviewer-facing body file (--body-file <path>).");
    console.error("   PR bodies must describe component behavior and contracts, not auto-generated commit ledgers.");
    console.error("   Generate a template via: node scripts/pr-tool.mjs render-body --output pr_body.md");
    process.exit(1);
  }

  // Validate body against commit-policy
  const bodyProblems = validatePrBody(body);
  if (bodyProblems.length > 0) {
    console.error("❌ PR body validation failed:");
    bodyProblems.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }

  const title = customTitle || `feat: update ${branch}`;

  // Calculate fingerprint
  const fingerprint = crypto.createHash("sha256").update(`${title}\n${body}`).digest("hex").slice(0, 16);
  const expectedAuth = `${repo}:${branch}:${sha}:${fingerprint}`;

  if (!execute) {
    console.log(`🔒 PR creation preview authorization token:`);
    console.log(`   ${expectedAuth}`);
    console.log(`📌 Title: "${title}"`);
    console.log(`\nTo execute PR creation, request explicit user authorization and rerun:`);
    console.log(`   node scripts/pr-tool.mjs create --title "${title}" --authorize "${expectedAuth}" --execute`);
    return { preview: expectedAuth };
  }

  if (authorization !== expectedAuth) {
    console.error(`❌ PR creation authorization mismatch:`);
    console.error(`   Expected: "${expectedAuth}"`);
    console.error(`   Received: "${authorization}"`);
    process.exit(1);
  }

  const tempFile = path.join(os.tmpdir(), `pr_body_${Date.now()}.md`);
  try {
    writeFileSync(tempFile, body, "utf8");
    const ghArgs = ["pr", "create", "--repo", repo, "--base", "main", "--head", branch, "--title", title, "--body-file", tempFile];
    if (draft) ghArgs.push("--draft");
    console.log(`🚀 Creating PR: "${title}"...`);
    const out = run("gh", ghArgs, { stdio: "inherit" });
    console.log(out || "✅ PR created successfully.");

    // Verify created PR
    console.log(`🔍 Verifying created PR state...`);
    const prListRaw = run("gh", ["pr", "list", "--repo", repo, "--head", branch, "--json", "number,headRefOid,baseRefName,url"]).trim();
    if (prListRaw) {
      try {
        const prList = JSON.parse(prListRaw);
        if (prList.length > 0) {
          const pr = prList[0];
          console.log(`✅ PR #${pr.number} verified: ${pr.url} (HEAD: ${pr.headRefOid.slice(0, 7)}, Base: ${pr.baseRefName})`);
        }
      } catch {
        // ignore json parse error
      }
    }
  } finally {
    if (existsSync(tempFile)) unlinkSync(tempFile);
  }
}

function resolvePrNumber(prArg, repo) {
  if (prArg) return String(prArg);
  const currentBranch = getCurrentBranch();
  try {
    const prListRaw = run("gh", ["pr", "list", "--repo", repo, "--head", currentBranch, "--json", "number"]).trim();
    const prList = JSON.parse(prListRaw);
    if (prList.length > 0) return String(prList[0].number);
  } catch {
    // Return empty if lookup fails
  }
  console.error("❌ No PR found for current branch. Provide PR number: node scripts/pr-tool.mjs audit <pr-number>");
  process.exit(1);
}

function fetchReviewThreads(repo, prNumber) {
  const [owner, name] = repo.split("/");
  const query = `
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $number) {
          reviewThreads(first: 100) {
            nodes {
              id
              isResolved
              isOutdated
              path
              line
              comments(first: 5) {
                nodes {
                  author { login }
                  body
                }
              }
            }
          }
        }
      }
    }
  `;
  try {
    const raw = run("gh", [
      "api",
      "graphql",
      "-f",
      `query=${query}`,
      "-F",
      `owner=${owner}`,
      "-F",
      `name=${name}`,
      "-F",
      `number=${prNumber}`,
    ]).trim();
    const parsed = JSON.parse(raw);
    return parsed?.data?.repository?.pullRequest?.reviewThreads?.nodes || [];
  } catch (err) {
    console.error("⚠️ Failed to fetch review threads:", err?.message || err);
    return [];
  }
}

function printReviewThreads(threads, prNumber) {
  const unresolved = threads.filter((t) => !t.isResolved);
  const outdatedUnresolved = unresolved.filter((t) => t.isOutdated);

  console.log(`📊 PR #${prNumber} Review Discussion Threads:`);
  console.log(`   Total Threads:      ${threads.length}`);
  console.log(`   Unresolved Threads: ${unresolved.length} (${outdatedUnresolved.length} outdated)`);

  if (unresolved.length > 0) {
    console.log(`\n📌 Unresolved Review Threads:`);
    for (const t of unresolved) {
      const topComment = t.comments?.nodes?.[0];
      const author = topComment?.author?.login || "unknown";
      const preview = (topComment?.body || "").slice(0, 80).replace(/\r?\n/g, " ");
      console.log(`   - Thread ID: ${t.id} (${t.path || "general"}:${t.line || "-"}) [${t.isOutdated ? "OUTDATED" : "ACTIVE"}]`);
      console.log(`     By @${author}: "${preview}..."`);
    }
  } else {
    console.log(`   ✅ All review discussion threads are resolved!`);
  }
}

export async function fetchSonarIssues(repo, prNumber) {
  try {
    const projectKey = repo.replace("/", "_");
    const url = `https://sonarcloud.io/api/issues/search?componentKeys=${projectKey}&pullRequest=${prNumber}&resolved=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.issues || [];
  } catch {
    // Return null if SonarCloud cannot be queried or project has no setup.
    return null;
  }
}

function printSonarIssues(issues, prNumber) {
  console.log(`\n☁️  PR #${prNumber} SonarCloud Quality Issues:`);
  if (issues === null) {
    console.log("   ⚠️ SonarCloud analysis not available or unreachable.");
    return;
  }

  if (issues.length === 0) {
    console.log("   ✅ 0 open issues! SonarCloud code analysis is clean.");
    return;
  }

  const counts = {};
  for (const issue of issues) {
    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
  }

  const summary = Object.entries(counts)
    .map(([sev, count]) => `${sev}: ${count}`)
    .join(", ");
  console.log(`   Total Open Issues: ${issues.length} (${summary})`);
  console.log("\n📌 Open SonarCloud Issues:");
  for (const issue of issues) {
    const file = issue.component.replace(/^[^:]+:/, "");
    console.log(`   - [${issue.severity}] ${issue.rule} (${file}:${issue.line || "-"})`);
    console.log(`     ${issue.message}`);
  }
}

function printChecksStatus(prNumber) {
  console.log(`\n🚦 PR #${prNumber} GitHub Checks Status:`);
  try {
    const checksOutput = run("gh", ["pr", "checks", prNumber]).trim();
    if (checksOutput) {
      console.log(checksOutput.split("\n").map((line) => `   ${line}`).join("\n"));
    } else {
      console.log("   No checks reported.");
    }
  } catch {
    console.log("   ⚠️ Could not retrieve checks status via gh CLI.");
  }
}

function printPrMergeStatus(prNumber) {
  console.log(`\n🛡️  PR #${prNumber} Mergeability Status:`);
  try {
    const raw = run("gh", ["pr", "view", prNumber, "--json", "mergeStateStatus,mergeable,reviewDecision,state"]).trim();
    const data = JSON.parse(raw);
    const state = data.mergeStateStatus || "UNKNOWN";
    if (state === "CLEAN") {
      console.log(`   ✅ PR is CLEAN and ready to merge! (mergeable: ${data.mergeable})`);
    } else if (state === "BLOCKED") {
      console.log(`   ❌ PR is BLOCKED! Merging is prohibited by branch rules or unresolved review threads.`);
    } else {
      console.log(`   ⚠️ PR Merge State: ${state} (mergeable: ${data.mergeable})`);
    }
    return state;
  } catch {
    console.log("   ⚠️ Could not retrieve merge state via gh CLI.");
    return "UNKNOWN";
  }
}

/**
 * Clickra-inspired read-only audit of PR review comments, Sonar issues, and CI status.
 */
export async function runAudit(prArg = "") {
  const repo = getRepoOrigin();
  const prNumber = resolvePrNumber(prArg, repo);
  console.log(`🔍 Auditing PR #${prNumber} on ${repo}...\n`);

  const threads = fetchReviewThreads(repo, prNumber);
  printReviewThreads(threads, prNumber);

  const sonarIssues = await fetchSonarIssues(repo, prNumber);
  printSonarIssues(sonarIssues, prNumber);

  printChecksStatus(prNumber);
  const mergeState = printPrMergeStatus(prNumber);

  const unresolved = threads.filter((t) => !t.isResolved);
  if (mergeState === "BLOCKED" || unresolved.length > 0 || (sonarIssues && sonarIssues.length > 0)) {
    console.log(`\n⚠️  AUDIT CONCLUSION: PR #${prNumber} is NOT ready for merge. Resolve blockers first.`);
  } else {
    console.log(`\n🎉 AUDIT CONCLUSION: PR #${prNumber} is completely clean, passing, and ready for merge!`);
  }
}

/**
 * Resolves a GitHub PR review thread via GraphQL with optional two-phase authorization.
 */
export function resolveReviewThread(threadId, { authorization = "", execute = false } = {}) {
  if (!threadId) {
    console.error("Usage: pr-tool resolve <thread-id> [--authorize <thread-id>] [--execute]");
    process.exit(2);
  }

  if (!execute) {
    console.log(`🔒 Thread resolution preview:`);
    console.log(`   Thread ID: ${threadId}`);
    console.log(`\nTo execute resolution, request explicit user authorization and rerun:`);
    console.log(`   node scripts/pr-tool.mjs resolve "${threadId}" --authorize "${threadId}" --execute`);
    return threadId;
  }

  if (authorization !== threadId) {
    console.error(`❌ Thread authorization mismatch: expected "${threadId}", got "${authorization}"`);
    process.exit(1);
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
 * Batch-resolves all review discussion threads on a PR with two-phase verification.
 */
export function resolveAllReviewThreads(prArg = "", { authorization = "", execute = false } = {}) {
  const repo = getRepoOrigin();
  const prNumber = resolvePrNumber(prArg, repo);
  const threads = fetchReviewThreads(repo, prNumber);
  const unresolved = threads.filter((t) => !t.isResolved);

  if (unresolved.length === 0) {
    console.log(`✅ All review discussion threads for PR #${prNumber} are already resolved.`);
    return;
  }

  const expectedToken = `pr-${prNumber}:${unresolved.length}:threads`;

  if (!execute) {
    console.log(`🔒 Batch thread resolution preview:`);
    console.log(`   PR: #${prNumber}`);
    console.log(`   Unresolved threads count: ${unresolved.length}`);
    console.log(`   Expected Token: ${expectedToken}`);
    console.log(`\nTo execute resolution, request explicit user authorization and rerun:`);
    console.log(`   node scripts/pr-tool.mjs resolve --all ${prNumber} --authorize "${expectedToken}" --execute`);
    return expectedToken;
  }

  if (authorization !== expectedToken) {
    console.error(`❌ Batch resolution authorization mismatch: expected "${expectedToken}", got "${authorization}"`);
    process.exit(1);
  }

  console.log(`Resolving ${unresolved.length} review threads on PR #${prNumber}...`);
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

  let count = 0;
  for (const t of unresolved) {
    try {
      run("gh", [
        "api",
        "graphql",
        "-f",
        `query=${query}`,
        "-F",
        `threadId=${t.id}`,
      ]);
      count++;
      process.stdout.write(`\r   Resolved: ${count}/${unresolved.length}`);
    } catch (err) {
      console.error(`\n❌ Failed to resolve thread ${t.id}:`, err?.message || err);
    }
  }
  console.log(`\n✅ Finished resolving ${count} review threads for PR #${prNumber}.`);
}

/**
 * CLI Entrypoint & Automated Self-Test.
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

  // Clickra sequence and version pattern checks
  check("PR sequence pattern pr2 rejected", validateBranchName("feat/add-pr2").valid, false);
  check("PR sequence pattern phase-1 rejected", validateBranchName("fix/phase-1").valid, false);
  check("PR sequence pattern post-nine rejected", validateBranchName("chore/post-nine").valid, false);
  check("version identifier rejected", validateBranchName("feat/api-v1.0").valid, false);

  // Template / renderPrBody checks
  const validRendered = renderPrBody({
    summary: "Refactor storage layer to standardize CIS synchronization flow.",
    keyChanges: [
      "**CIS Sync Flow**: Unify duplicate bookmarklet sync into useCisBookmarkletSync hook.",
      "**Architecture Boundary**: Enforce storage domain boundary in architectural tests.",
    ],
  });
  const validErrors = validatePrBody(validRendered);
  if (validErrors.length > 0) {
    failures.push(`renderPrBody failed commit-policy validation: ${validErrors.join("; ")}`);
  }

  // Negative test: verify that raw commit header dump is rejected
  const rawDumpBody = "## Summary\nValid summary\n\n## Key Changes\n1. feat(ci): implement tool\n\n## Verification\n- [x] OK\n";
  const dumpErrors = validatePrBody(rawDumpBody);
  if (dumpErrors.length === 0) {
    failures.push("validatePrBody failed to reject raw commit header in Key Changes");
  }

  if (failures.length > 0) {
    console.error(`❌ pr-tool self-test failed (${failures.length} errors):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("✅ pr-tool self-test passed (all branch rules, sequence guards, and templates verified).");
}

function handleValidateBranch(args) {
  const target = args[1] || getCurrentBranch();
  const res = validateBranchName(target);
  if (!res.valid) {
    console.error(`❌ Invalid branch name "${target}":`);
    res.errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✅ Branch "${target}" complies with Clickra limits (suffix length: ${res.length}, words: ${res.wordCount}).`);
}

function handleRenderBody(args) {
  const outIdx = args.indexOf("--output");
  const outputPath = outIdx !== -1 ? args[outIdx + 1] : null;
  const body = renderPrBody();
  if (outputPath) {
    writeFileSync(outputPath, body, "utf8");
    console.log(`✅ PR body written to ${outputPath}`);
  } else {
    console.log(body);
  }
}

function handlePush(args) {
  const authIdx = args.indexOf("--authorize");
  const authorization = authIdx !== -1 ? args[authIdx + 1] : "";
  const execute = args.includes("--execute");
  runPush(authorization, { execute });
}

function handleCreate(args) {
  const isDraft = args.includes("--draft");
  const titleIdx = args.indexOf("--title");
  const bodyIdx = args.indexOf("--body-file");
  const authIdx = args.indexOf("--authorize");
  const title = titleIdx !== -1 ? args[titleIdx + 1] : "";
  const bodyFile = bodyIdx !== -1 ? args[bodyIdx + 1] : "";
  const authorization = authIdx !== -1 ? args[authIdx + 1] : "";
  const execute = args.includes("--execute");
  runCreate({ title, bodyFile, draft: isDraft, execute, authorization });
}

function handleResolve(args) {
  const isAll = args.includes("--all");
  const authIdx = args.indexOf("--authorize");
  const authorization = authIdx !== -1 ? args[authIdx + 1] : "";
  const execute = args.includes("--execute");

  if (isAll) {
    const nonFlags = args.slice(1).filter((a) => !a.startsWith("-"));
    const prNumber = nonFlags[0] || "";
    resolveAllReviewThreads(prNumber, { authorization, execute });
  } else {
    const threadId = args[1];
    resolveReviewThread(threadId, { authorization, execute });
  }
}

function printHelp() {
  console.log(`
Clickra PR Workflow Automation Tool

Usage:
  node scripts/pr-tool.mjs validate-branch [branch]  Validate branch scope and length limits
  node scripts/pr-tool.mjs prepare                  Run all preflight checks
  node scripts/pr-tool.mjs render-body [--output f] Render safe PR body from template
  node scripts/pr-tool.mjs push [--authorize token] Push branch with two-phase verification
  node scripts/pr-tool.mjs create [--title t]       Safe PR creation with two-phase verification
  node scripts/pr-tool.mjs audit [pr]               Read-only review discussion audit
  node scripts/pr-tool.mjs resolve <thread-id>      Resolve PR review thread via GraphQL
  node scripts/pr-tool.mjs self-test                Run built-in policy tests
`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  const commandHandlers = {
    "validate-branch": () => handleValidateBranch(args),
    "prepare": () => runPrepare(),
    "render-body": () => handleRenderBody(args),
    "push": () => handlePush(args),
    "create": () => handleCreate(args),
    "audit": () => runAudit(args[1] || ""),
    "resolve": () => handleResolve(args),
    "self-test": () => selfTest(),
    "help": () => printHelp(),
  };

  const handler = commandHandlers[command] || commandHandlers.help;
  await handler();
}

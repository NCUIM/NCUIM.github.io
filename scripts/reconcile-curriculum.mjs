#!/usr/bin/env node
/**
 * Reconcile the IM master's course list against live CIS data.
 *
 * Sources:
 *  1. all.json (S3)         → IM dept courses (serialNo, classNo, title, ...)
 *  2. CIS byKeywords row    → per-course 時間/教室 (room) + 選修別
 *  3. CIS 分發條件 popup      → per-course restriction (who may take it)
 *
 * The snapshot stores only CIS-derived facts (master eligibility + room +
 * 選修別). 必修 scope/year facts are NOT duplicated here: they live in
 * src/data/im-curriculum.ts (REQUIRED_COURSE_FACTS) and are applied at
 * runtime by the app, so the tool never needs to import TS curriculum code.
 *
 * Output: src/data/im-master-snapshot.json — a committed snapshot used at
 * runtime to filter the master list and attach rooms. Regenerate it whenever
 * the semester turns over:
 *   node scripts/reconcile-curriculum.mjs
 *
 * --check (used by CI): compare live CIS against the committed snapshot and
 * exit nonzero when they drift, without writing the file:
 *   node scripts/reconcile-curriculum.mjs --check
 *
 * Point at another semester with NCU_SEMESTER=1152 (or any env var).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const ALL_COURSES_URL = "https://ncucf-data.s3.amazonaws.com/data/dynamic/all.json";
const CIS_QUERY_URL = "https://cis.ncu.edu.tw/Course/main/query/byKeywords";
const IM_DEPT_ID = "deptI1I4003I0";

/** Path of the committed snapshot the app consumes at runtime. */
const SNAPSHOT_PATH = path.join(REPO_ROOT, "src", "data", "im-master-snapshot.json");

/** --check compares against the committed snapshot instead of writing it. */
const CHECK = process.argv.includes("--check");

/**
 * Current semester used by the keyword query. NCU_SEMESTER wins; otherwise
 * --check targets the term the committed snapshot claims (so CI stays green
 * until the snapshot is actually regenerated for a new term); a bare run with
 * no committed snapshot falls back to the default below.
 */
let SEMESTER = process.env.NCU_SEMESTER || "";
const DEFAULT_SEMESTER = "1151";
let SEM_YEAR = "";
let SEM_FOREIGN = "";

function resolveSemester() {
  if (SEMESTER) return SEMESTER;
  try {
    const committed = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
    if (committed.semester) return committed.semester;
  } catch {
    /* no committed snapshot yet — first generation */
  }
  return DEFAULT_SEMESTER;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, opts) {
  const res = await fetch(url, {
    headers: { "Accept-Language": "zh-TW" },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

/** Take just the Chinese course title from an all.json title. */
function cleanTitle(rawTitle) {
  if (!rawTitle) return "";
  // CIS titles are "中文 English…" — keep the leading CJK/numeral chunk.
  const m = /^([\u4e00-\u9fa5\dⅠⅡⅢⅣ·、]+[\s-]*)([A-Z][\s\S]*)$/.exec(rawTitle);
  if (m && /[\u4e00-\u9fa5]/.test(m[1])) return m[1].trim();
  return rawTitle.trim();
}

/** Fetch all courses from the S3 dump. */
async function fetchAllCourses() {
  const text = await fetchText(ALL_COURSES_URL);
  const data = JSON.parse(text);
  return (data.courses || []);
}

/** Parse one byKeywords result row (a <tr class="odd|even">). */
function parseKeywordRow(rowHtml) {
  const cells = [...rowHtml.matchAll(/<td>(.*?)<\/td>/gs)].map((m) => m[1]);
  if (cells.length < 6) return null;
  const clean = (x) =>
    x.replace(/<br\s*\/?>/g, " | ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const first = clean(cells[0]);
  const m = first.match(/^(\d+)\s*\|\s*([A-Z]{2,}\d+[A-Z0-9*-]*)$/);
  if (!m) return null;
  const timeRoom = clean(cells[4]);
  // 時間/教室 e.g. "三678/I1-404 (管理二館-404)" — extract the room token after '/'
  const roomMatch = timeRoom.match(/\/([A-Z][A-Z0-9]*(?:-\d+)*)\s*\(/);
  return {
    serialNo: m[1],
    classNo: m[2],
    name: clean(cells[1]),
    credit: Number(clean(cells[3])) || 0,
    timeRoom,
    room: roomMatch ? roomMatch[1] : undefined,
    courseType: clean(cells[5]), // 必修 | 選修
  };
}

/**
 * Fetch the byKeywords result rows matching a keyword (classNo prefix).
 * CIS returns a page with the matching courses; we collect every result row.
 */
async function fetchKeywordRows(keyword) {
  const body = new URLSearchParams({
    keyword,
    query: "true",
    year: SEM_YEAR,
    foreign_semester: SEM_FOREIGN,
  });
  const html = await fetchText(CIS_QUERY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const rows = [...html.matchAll(/<tr class="(?:odd|even)">(.*?)<\/tr>/gs)].map((m) =>
    parseKeywordRow(m[1]),
  );
  return rows.filter(Boolean);
}

/** Fetch the 分發條件 popup for one serialNo; returns the restriction table rows. */
async function fetchDistributionLimit(serialNo) {
  const params = new URLSearchParams({ limit: String(serialNo) });
  if (SEMESTER) params.set("semester", SEMESTER);
  const html = await fetchText(`${CIS_QUERY_URL}?${params}`);
  // rows: <td>1</td><td>系所:限…。…</td>
  const rows = [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g)]
    .map((m) => ({
      priority: m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, ""),
      condition: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    }))
    .filter((r) => /^\d+$/.test(r.priority) && r.condition.length > 0);
  const isOpen = /課程沒有限制/.test(html);
  return { isOpen, rows };
}

/** Decide whether a course admits the regular IM master's cohort from its 分發條件. */
function allowsMaster(limit) {
  if (limit.isOpen) return true;
  const all = limit.rows.map((r) => r.condition).join("；");
  // open bucket for master's (any dept/college wording) counts
  if (/學制:限碩士班/.test(all) && !/碩士在職專班/.test(all)) return true;
  // department-scoped: 資訊管理學系碩士班 (exactly master's, not 在職/博士-only)
  return /系所:限[^。]*資訊管理學系碩士班/.test(all);
}

async function main() {
  SEMESTER = resolveSemester();
  SEM_YEAR = SEMESTER.slice(0, 3); // "115"
  SEM_FOREIGN = SEMESTER.slice(3); // "1" = 上學期

  console.log(`Fetching all.json… (semester ${SEMESTER})`);
  const all = await fetchAllCourses();
  const imCourses = all.filter(
    (c) => (c.departmentIds || []).includes(IM_DEPT_ID) && /^IM[A-Z]?\d/.test(c.classNo),
  );
  console.log(`IM dept courses: ${imCourses.length}`);

  // Fetch, one keyword request + one limit request per course.
  const courses = [];
  for (const c of imCourses) {
    const kw = c.classNo.split("-")[0].replace(/\*$/, "");
    const rows = await fetchKeywordRows(kw);
    const row = rows.find((r) => r.classNo === c.classNo) || rows[0];
    if (!row) {
      console.warn(`  ! no CIS row for ${c.classNo}`);
      continue;
    }
    const limit = await fetchDistributionLimit(row.serialNo);
    courses.push({
      serialNo: row.serialNo,
      classNo: row.classNo,
      title: cleanTitle(c.title),
      credit: row.credit,
      room: row.room,
      courseType: row.courseType.toUpperCase(),
      allowMaster: allowsMaster(limit),
      limitConditions: limit.rows.length,
    });
    await sleep(120); // be polite to CIS
  }

  const out = {
    semester: SEMESTER,
    generatedAt: new Date().toISOString(),
    courses: Object.fromEntries(courses.map((c) => [c.serialNo, c])),
  };

  if (CHECK) {
    const notes = checkDrift(SNAPSHOT_PATH, out);
    if (notes.length === 0) {
      console.log(
        `OK — committed snapshot (${Object.keys(out.courses).length} courses, ${SEMESTER}) matches live CIS.`,
      );
      return;
    }
    console.error(`DRIFT DETECTED between live CIS (${SEMESTER}) and the committed snapshot:`);
    for (const n of notes) console.error(`  - ${n}`);
    console.error("\nRegenerate and commit the snapshot:");
    console.error("  node scripts/reconcile-curriculum.mjs");
    process.exitCode = 1;
    return;
  }

  const masterCourses = courses.filter((c) => c.allowMaster);
  console.log(`Total IM courses: ${courses.length}; master-eligible: ${masterCourses.length}`);
  console.log("\nMaster-eligible:");
  for (const c of [...masterCourses].sort((a, b) => a.classNo.localeCompare(b.classNo))) {
    console.log(`  ${c.classNo.padEnd(10)} ${c.title.padEnd(14)} room=${(c.room || "?").padEnd(8)} ${c.courseType}`);
  }
  console.log("\nNOT master-eligible:");
  for (const c of courses.filter((x) => !x.allowMaster).sort((a, b) => a.classNo.localeCompare(b.classNo))) {
    console.log(`  ${c.classNo.padEnd(10)} ${c.title.padEnd(14)} (conditions=${c.limitConditions})`);
  }

  writeFileSync(SNAPSHOT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(`\nSnapshot written: ${SNAPSHOT_PATH}`);
}

/**
 * Compare a freshly fetched snapshot against the committed one and return
 * drift notes (empty array = in sync). Semester and per-course fields are
 * compared; generatedAt is metadata and ignored.
 */
function checkDrift(committedPath, fresh) {
  let committed;
  try {
    committed = JSON.parse(readFileSync(committedPath, "utf8"));
  } catch {
    return [`committed snapshot missing (${committedPath}) — run the tool without --check first`];
  }

  const notes = [];
  if (committed.semester !== fresh.semester) {
    notes.push(`semester differs: committed=${committed.semester} vs live=${fresh.semester}`);
  }

  const oldBySerial = committed.courses || {};
  const newBySerial = fresh.courses || {};
  const serials = new Set([...Object.keys(oldBySerial), ...Object.keys(newBySerial)]);
  const fields = ["classNo", "title", "credit", "room", "courseType", "allowMaster"];
  for (const sn of [...serials].sort((a, b) => Number(a) - Number(b))) {
    const a = oldBySerial[sn];
    const b = newBySerial[sn];
    if (!a) {
      notes.push(`new course ${sn} (${b.classNo} ${b.title}; allowMaster=${b.allowMaster}, room=${b.room ?? "?"})`);
      continue;
    }
    if (!b) {
      notes.push(`dropped course ${sn} (${a.classNo} ${a.title})`);
      continue;
    }
    const changed = fields.filter((k) => String(a[k] ?? "") !== String(b[k] ?? ""));
    if (changed.length > 0) {
      notes.push(
        `changed ${a.classNo} (${sn}): ${changed
          .map((k) => `${k} ${JSON.stringify(a[k] ?? "")} -> ${JSON.stringify(b[k] ?? "")}`)
          .join(", ")}`,
      );
    }
  }
  return notes;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

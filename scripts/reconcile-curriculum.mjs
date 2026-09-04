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
 * Output: src/data/im-master-snapshot.json (CIS facts) and
 * src/data/im-master-courses.json (bundled offline fallback, same master set).
 * Regenerate both whenever the semester turns over:
 *   node scripts/reconcile-curriculum.mjs
 *
 * --check (used by CI): compare live CIS against the committed snapshot and
 * exit nonzero when they drift, without writing the file:
 *   node scripts/reconcile-curriculum.mjs --check
 *
 * Point at another semester with NCU_SEMESTER=1152 (or any env var).
 *
 * See docs/engineering/curriculum-data.md for the semester-turnover SOP.
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

/**
 * Path of the bundled offline fallback. Regenerated from the same run as the
 * snapshot so the network-failure list always matches the master set; only
 * fields all.json provides (teachers/classTimes/counts) plus the CIS room are
 * stored — 必修 tags are applied at runtime from im-curriculum.ts.
 */
const FALLBACK_PATH = path.join(REPO_ROOT, "src", "data", "im-master-courses.json");

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

/** Collapse whitespace runs to a single space and trim. */
const collapseSpaces = (s) => s.replace(/\s+/g, " ").trim();

/**
 * Strip HTML tags with a single linear scan (no regex backtracking, unlike
 * `<[^>]+>` which degrades quadratically on input without a closing `>`).
 * `<br>` variants become " | " so multi-line cells stay readable; every other
 * tag becomes a single space. A dangling `<` without a closing `>` is kept
 * verbatim (same behavior as the old tag-stripping regexes).
 */
const stripTags = (raw) => {
  let out = "";
  let i = 0;
  while (i < raw.length) {
    const lt = raw.indexOf("<", i);
    if (lt === -1) {
      out += raw.slice(i);
      break;
    }
    out += raw.slice(i, lt);
    const gt = raw.indexOf(">", lt + 1);
    if (gt === -1) {
      out += raw.slice(lt);
      break;
    }
    const tag = raw.slice(lt + 1, gt).trim().toLowerCase();
    out += tag.startsWith("br") ? " | " : " ";
    i = gt + 1;
  }
  return out;
};

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
  const clean = (x) => collapseSpaces(stripTags(x));
  const first = clean(cells[0]);
  // `[A-Z]{2,}\d` — a single required digit avoids the ambiguous `\d+` /
  // `[A-Z0-9*-]*` split that made this regex backtrack quadratically.
  const m = first.match(/^(\d+)\s*\|\s*([A-Z]{2,}\d[A-Z0-9*-]*)$/);
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
      priority: stripTags(m[1]).replace(/\s+/g, ""),
      condition: collapseSpaces(stripTags(m[2])),
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
  // all.json-only fields (teachers/classTimes/counts) kept aside: they feed the
  // offline fallback but intentionally stay out of the snapshot (which stores
  // only CIS-derived facts).
  const allFields = new Map();
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
    allFields.set(row.serialNo, {
      teachers: c.teachers || [],
      classTimes: c.classTimes || [],
      passwordCard: c.passwordCard ?? null,
      limitCnt: c.limitCnt ?? null,
      admitCnt: c.admitCnt ?? null,
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

  // Regenerate the bundled offline fallback from the same run, so the
  // network-failure list mirrors the master set (rooms from CIS, rest from
  // all.json). Required tags are NOT stored here — the app derives them at
  // runtime from im-curriculum.ts facts.
  const fallbackCourses = courses
    .filter((c) => c.allowMaster)
    .map((c) => {
      const f = allFields.get(c.serialNo) || {};
      return {
        serialNo: Number(c.serialNo),
        classNo: c.classNo,
        title: c.title,
        credit: c.credit,
        teachers: f.teachers || [],
        classTimes: f.classTimes || [],
        room: c.room,
        courseType: c.courseType,
        passwordCard: f.passwordCard ?? null,
        limitCnt: f.limitCnt ?? null,
        admitCnt: f.admitCnt ?? null,
      };
    })
    .sort((a, b) => Number(a.serialNo) - Number(b.serialNo));
  writeFileSync(FALLBACK_PATH, JSON.stringify(fallbackCourses, null, 2), "utf8");
  console.log(`Offline fallback written: ${FALLBACK_PATH} (${fallbackCourses.length} courses)`);
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

try {
  await main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

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
 * Output: a snapshot JSON (see output below) used at runtime to filter
 * the master list and attach rooms. Run from repo root:
 *   node scripts/reconcile-curriculum.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const ALL_COURSES_URL = "https://ncucf-data.s3.amazonaws.com/data/dynamic/all.json";
const CIS_QUERY_URL = "https://cis.ncu.edu.tw/Course/main/query/byKeywords";
const IM_DEPT_ID = "deptI1I4003I0";

/** The master list courses whose room/tag/eligibility we want to pin down. */
const SEMESTER = process.env.NCU_SEMESTER || ""; // e.g. "1151"; empty = CIS default

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
  const body = new URLSearchParams({ keyword, query: "true", year: "115", foreign_semester: "1" });
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

/** -- only skeleton for now; real facts imported from im-curriculum.ts in the full PR -- */
/*
 * -- master-eligibility + room snapshot only; 必修 facts applied in-app from
 *    im-curriculum.ts REQUIRED_COURSE_FACTS (see header note) --
 */

async function main() {
  console.log("Fetching all.json…");
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

  const masterCourses = courses.filter((c) => c.allowMaster);
  console.log(`\nTotal IM courses: ${courses.length}; master-eligible: ${masterCourses.length}`);
  console.log("\nMaster-eligible:");
  for (const c of [...masterCourses].sort((a, b) => a.classNo.localeCompare(b.classNo))) {
    console.log(`  ${c.classNo.padEnd(10)} ${c.title.padEnd(14)} room=${(c.room || "?").padEnd(8)} ${c.courseType}`);
  }
  console.log("\nNOT master-eligible:");
  for (const c of courses.filter((x) => !x.allowMaster).sort((a, b) => a.classNo.localeCompare(b.classNo))) {
    console.log(`  ${c.classNo.padEnd(10)} ${c.title.padEnd(14)} (conditions=${c.limitConditions})`);
  }

  const out = {
    semester: SEMESTER || null,
    generatedAt: new Date().toISOString(),
    courses: Object.fromEntries(courses.map((c) => [c.serialNo, c])),
  };
  const outPath = process.env.SNAPSHOT_OUT || path.join(REPO_ROOT, "im-master-snapshot.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`\nSnapshot written: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * NCU CIS Course API
 *
 * Fetches the student's selected courses from cis.ncu.edu.tw.
 *
 * CIS Architecture (after login):
 *   sheets.xml → lists "sheets" (panels), each with a ref= pointing to
 *                 an XML data file containing <Course> elements.
 *   Course XML → <Course Title="..." SerialNo="..." Status="ready|register|..." />
 *
 * Flow:
 *   1. Login → JSESSIONID
 *   2. GET /Course/main/support/sheets.xml → get sheet definitions
 *   3. For each sheet with ref=, GET {ref}?id={sheetId} → parse Course elements
 *   4. Filter Status === "ready" for selected courses
 */

import { cisFetch, isCisLoggedIn } from "./cis-login";

// ── Types ─────────────────────────────────────────────────────

export interface CisCourse {
  serialNo: string;
  classNo: string;
  name: string;
  teacher: string;
  room: string;
  credit: number;
  classTimes: string[];
  classTimesAlt: string;
  status: string;
  admitCnt: number;
  limitCnt: number;
  waitCnt: number;
}

// ── XML Parsing Helpers (browser-native DOMParser) ────────────

function parseXml(text: string): Document {
  return new DOMParser().parseFromString(text, "text/xml");
}

// ── API ───────────────────────────────────────────────────────

/**
 * Fetch sheets.xml to discover which XML data files contain course lists.
 */
async function fetchSheets(): Promise<
  { id: string; title: string; ref: string; ulClass: string }[]
> {
  const res = await cisFetch("/Course/main/support/sheets.xml");
  if (!res.ok) throw new Error(`sheets.xml fetch failed: ${res.status}`);

  const text = await res.text();
  // CIS JS redirect page means session expired
  if (text.includes("window.location")) {
    throw new Error("Session 已過期，請重新連結課務系統");
  }
  const xml = parseXml(text);
  const sheets: { id: string; title: string; ref: string; ulClass: string }[] =
    [];

  xml.querySelectorAll("Sheets > Sheet").forEach((el) => {
    sheets.push({
      id: el.getAttribute("id") ?? "",
      title: el.getAttribute("Title") ?? "",
      ref: el.getAttribute("ref") ?? "",
      ulClass: el.getAttribute("class") ?? "",
    });
  });

  return sheets;
}

/**
 * Fetch a course XML data file and parse <Course> elements.
 */
async function fetchCourseXml(
  dataSource: string,
  sheetId: string,
): Promise<CisCourse[]> {
  const res = await cisFetch(`${dataSource}?id=${sheetId}`);
  if (!res.ok) return [];

  const text = await res.text();
  if (text.includes("window.location")) return [];
  const xml = parseXml(text);
  const courses: CisCourse[] = [];

  xml.querySelectorAll("Courses > Course").forEach((el) => {
    const serialNo = el.getAttribute("SerialNo") ?? "";
    if (!serialNo) return;

    courses.push({
      serialNo,
      classNo: el.getAttribute("ClassNo") ?? "",
      name: el.getAttribute("Title") ?? "",
      teacher: el.getAttribute("Teacher") ?? "",
      room: "",
      credit: parseInt(el.getAttribute("credit") ?? "0", 10),
      classTimes: (el.getAttribute("ClassTime") ?? "").split(","),
      classTimesAlt: el.getAttribute("ClassTimeAlt") ?? "",
      status: el.getAttribute("Status") ?? "default",
      admitCnt: parseInt(el.getAttribute("admitCnt") ?? "0", 10),
      limitCnt: parseInt(el.getAttribute("limitCnt") ?? "0", 10),
      waitCnt: parseInt(el.getAttribute("waitCnt") ?? "0", 10),
    });
  });

  return courses;
}

/**
 * Fetch the A4Crstable page and extract room info per course.
 * The timetable cells contain text like "課程名稱 教師 (教室)".
 * Returns a map from teacher name → room.
 */
async function fetchRoomMap(): Promise<Map<string, string>> {
  const roomMap = new Map<string, string>();
  try {
    const res = await cisFetch("/Course/main/personal/A4Crstable");
    if (!res.ok) return roomMap;
    const html = await res.text();
    if (html.includes("window.location")) return roomMap;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const tables = doc.querySelectorAll("table");
    for (const table of tables) {
      const rows = table.querySelectorAll("tr");
      if (rows.length < 5) continue;
      for (const row of rows) {
        row.querySelectorAll("td").forEach((td) => {
          // Cell text: "管理溝通 何迪亞 (I1-404)" or empty
          const text = td.textContent?.trim() ?? "";
          // Match: name teacher (room)
          const m = text.match(/^(.+?)\s+(\S+?)\s*\(([^)]+)\)$/);
          if (m) {
            const teacher = m[2];
            const room = m[3];
            roomMap.set(teacher, room);
          }
        });
      }
    }
  } catch {
    // Ignore room fetch failures
  }
  return roomMap;
}

/**
 * Fetch the student's selected courses (status === "ready") from CIS.
 *
 * This follows the same flow as the CIS frontend:
 *   sheets.xml → each sheet's XML data → filter by status.
 * Also fetches room info from A4Crstable.
 */
export async function fetchCisSelectedCourses(): Promise<CisCourse[]> {
  if (!isCisLoggedIn()) {
    throw new Error("Not logged in to CIS");
  }

  const [sheets, roomMap] = await Promise.all([fetchSheets(), fetchRoomMap()]);
  const allCourses: CisCourse[] = [];

  for (const sheet of sheets) {
    if (!sheet.ref) continue;
    try {
      const courses = await fetchCourseXml(sheet.ref, sheet.id);
      allCourses.push(...courses);
    } catch {
      // Skip failed sheets
    }
  }

  // Filter, deduplicate, and attach room info
  const seen = new Set<string>();
  return allCourses
    .filter((c) => (c.status === "ready" || c.status === "register") && !seen.has(c.serialNo))
    .map((c) => { seen.add(c.serialNo); return c; })
    .map((c) => ({
      ...c,
      room: roomMap.get(c.teacher) ?? "",
    }));
}

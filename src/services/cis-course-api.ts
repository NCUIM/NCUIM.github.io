/** CIS course and course-taking-status readers. */
import { cisFetch, isCisLoggedIn, cisLogout } from "./cis-login";

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
  semester?: string;
}

function isExpired(text: string): boolean {
  return text.includes("window.location") || text.includes("閒置時間過長");
}

async function readCisText(path: string, init?: RequestInit): Promise<string> {
  const res = await cisFetch(path, init);
  const text = await res.text();
  if (!res.ok || isExpired(text)) {
    cisLogout();
    throw new Error("CIS 登入已過期，請重新連結課務系統");
  }
  return text;
}

function toText(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

function parseCourseXml(text: string): CisCourse[] {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  return Array.from(doc.querySelectorAll("Courses > Course")).flatMap((el) => {
    const serialNo = el.getAttribute("SerialNo") ?? "";
    if (!serialNo) return [];
    return [{
      serialNo,
      classNo: el.getAttribute("ClassNo") ?? "",
      name: el.getAttribute("Title") ?? "",
      teacher: el.getAttribute("Teacher") ?? "",
      room: "",
      credit: Number(el.getAttribute("credit") ?? 0),
      classTimes: (el.getAttribute("ClassTime") ?? "").split(",").filter(Boolean),
      classTimesAlt: el.getAttribute("ClassTimeAlt") ?? "",
      status: el.getAttribute("Status") ?? "",
      admitCnt: Number(el.getAttribute("admitCnt") ?? 0),
      limitCnt: Number(el.getAttribute("limitCnt") ?? 0),
      waitCnt: Number(el.getAttribute("waitCnt") ?? 0),
    }];
  });
}

function parseSemesters(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const options = Array.from(doc.querySelectorAll<HTMLOptionElement>('select[name="semester"] option'));
  const current = options.find((option) => option.selected)?.value;
  const studentId = doc.body.textContent?.match(/Student ID Number:\s*(\d{3})/)?.[1];
  const startYear = studentId ? Number(studentId) : undefined;

  return options
    .map((option) => option.value)
    .filter((semester) => /^\d{4}$/.test(semester))
    .filter((semester) => !current || Number(semester) <= Number(current))
    .filter((semester) => !startYear || Number(semester.slice(0, 3)) >= startYear);
}

/** Parse one semester's official CIS course-taking-status page. */
export function parseCisCourseStatusPage(html: string, semester: string): CisCourse[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const seen = new Set<string>();

  return Array.from(doc.querySelectorAll("tr")).flatMap((row) => {
    const cells = Array.from(row.querySelectorAll("td, th")).map(toText);
    if (cells.length < 7 || !/^\d+$/.test(cells[1] ?? "") || !/^[A-Z]{2,}\d+/.test(cells[2] ?? "")) {
      return [];
    }

    const serialNo = cells[1];
    const classNo = cells[2];
    const key = `${serialNo}-${classNo}-${semester}`;
    if (seen.has(key)) return [];
    seen.add(key);

    return [{
      serialNo,
      classNo,
      name: (cells[4] ?? "").replace(/\s+[A-Za-z][A-Za-z\d .,&'()/-]*$/, "").trim(),
      teacher: cells[5] ?? "",
      room: "",
      credit: Number(cells[6] ?? 0),
      classTimes: [],
      classTimesAlt: "",
      status: cells[cells.length - 1] ?? "",
      admitCnt: 0,
      limitCnt: 0,
      waitCnt: 0,
      semester,
    }];
  });
}

async function fetchRoomMap(): Promise<Map<string, string>> {
  const rooms = new Map<string, string>();
  try {
    const doc = new DOMParser().parseFromString(
      await readCisText("/Course/main/personal/A4Crstable"),
      "text/html",
    );
    doc.querySelectorAll("td").forEach((cell) => {
      const match = toText(cell).match(/^(.+?)\s+(\S+?)\s*\(([^)]+)\)$/);
      if (match) rooms.set(match[2], match[3]);
    });
  } catch {
    // A room lookup must not hide an otherwise valid current timetable.
  }
  return rooms;
}

/** Fetch only the student's current CIS timetable for the timetable page. */
export async function fetchCisSelectedCourses(): Promise<CisCourse[]> {
  if (!isCisLoggedIn()) throw new Error("尚未連結課務系統，請輸入 JSESSIONID 登入");

  const [xml, rooms] = await Promise.all([
    readCisText("/Course/main/support/course.xml?id=my_class"),
    fetchRoomMap(),
  ]);
  return parseCourseXml(xml)
    .filter((course) => course.status === "ready" || course.status === "register")
    .map((course) => ({ ...course, room: rooms.get(course.teacher) ?? "" }));
}

/** Fetch every semester since the student's admission from CIS course-taking status. */
export async function fetchCisCourseHistory(): Promise<CisCourse[]> {
  if (!isCisLoggedIn()) throw new Error("尚未連結課務系統，請輸入 JSESSIONID 登入");

  const index = await readCisText("/Course/main/personal/perCrsstatus");
  const semesters = parseSemesters(index);
  const courses: CisCourse[] = [];

  // CIS is an older session-based system: concurrent POST requests can make the
  // proxy connection fail before CIS returns a response. Keep this sequential.
  for (const semester of semesters) {
    try {
      const html = await readCisText("/Course/main/personal/perCrsstatus", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ semester }).toString(),
      });
      courses.push(...parseCisCourseStatusPage(html, semester));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "未知錯誤";
      throw new Error(`讀取 ${semester} 學期修課結果失敗：${reason}`);
    }
  }

  return courses;
}

/**
 * Direct Web Remoting (DWR) Protocol Client for NCU CIS
 *
 * CIS uses DWR 2.x to fetch dynamic course data, classroom info,
 * and conflict checks. This client implements the minimum DWR
 * wire protocol needed to talk to the SelectCourseService.
 */

import { cisFetch } from "./cis-login";

export interface DwrCourseData {
  title: string;
  serial: string;
  classNo: string;
  teacher: string;
  status: string;
  classTimes: string[];
  classTimesAlt: string;
  credit: number;
}

// ── DWR Session State ─────────────────────────────────────────

let scriptSessionId: string | null = null;

/**
 * Initialize the DWR engine by fetching /Course/dwr/engine.js and extracting
 * the scriptSessionId needed for subsequent calls.
 */
export const initDwrEngine = async (): Promise<void> => {
  const res = await cisFetch("/Course/dwr/engine.js");
  const js = await res.text();

  const match = /setScriptSessionId\s*\(\s*["']([^"']+)["']\s*\)/.exec(js);
  if (match) {
    scriptSessionId = match[1];
  } else {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    scriptSessionId = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }
};

// ── DWR Call Protocol ─────────────────────────────────────────

const dwrCall = async (
  serviceName: string,
  methodName: string,
  params: unknown[],
): Promise<string> => {
  if (!scriptSessionId) {
    await initDwrEngine();
  }

  const lines = [
    "callCount=1",
    `scriptSessionId=${scriptSessionId}`,
    `c0-scriptName=${serviceName}`,
    `c0-methodName=${methodName}`,
    "c0-id=0",
  ];

  params.forEach((param, i) => {
    const type = typeof param === "number" ? "number" : "string";
    lines.push(`c0-param${i}=${type}:${param}`);
  });

  lines.push("batchId=1");
  const body = lines.join("\n");

  const res = await cisFetch(
    `/Course/dwr/call/plaincall/${serviceName}.${methodName}.dwr`,
    {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    },
  );

  const text = await res.text();
  const returnValueMatch = /\|4\|([^|]*)\|/.exec(text);
  if (returnValueMatch) {
    return returnValueMatch[1];
  }

  const s0Match = /s0=(.*)/.exec(text);
  if (s0Match) {
    return s0Match[1];
  }

  return text;
};

// ── Course Data API ───────────────────────────────────────────

/**
 * Get course data for a specific serial number via DWR.
 */
export const getCourseDataArray = async (
  serialNo: string,
): Promise<DwrCourseData | null> => {
  const raw = await dwrCall("SelectCourseService", "getCourseDataArray", [
    serialNo,
  ]);

  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length < 8) return null;

    return {
      title: arr[0],
      serial: arr[1],
      classNo: arr[2],
      teacher: arr[3],
      status: arr[4],
      classTimes: String(arr[5]).split(","),
      classTimesAlt: arr[6],
      credit: Number(arr[7]),
    };
  } catch {
    return null;
  }
};

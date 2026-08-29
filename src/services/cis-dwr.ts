/**
 * NCU CIS DWR Client
 *
 * Communicates with the CIS system's DWR (Direct Web Remoting) endpoints.
 * DWR is a Java AJAX framework that exposes server-side Java methods as
 * JavaScript functions via a specific HTTP protocol.
 *
 * Flow:
 * 1. Login to CIS → get JSESSIONID
 * 2. GET /Course/dwr/engine.js → extract dwr.engine.DEFAULT + scriptSessionId
 * 3. POST /Course/dwr/call/plaincall/{Service}.{method}.dwr → invoke Java methods
 */

import { cisFetch } from "./cis-login";

// ── Types ─────────────────────────────────────────────────────

export interface DwrCourseData {
  title: string;
  serial: string;
  classNo: string;
  teacher: string;
  status: string; // "ready" | "register" | "tracking" | "default"
  classTimes: string[];
  classTimesAlt: string;
  credit: number;
}

// ── DWR Engine Initialization ─────────────────────────────────

let scriptSessionId = "";

/**
 * Initialize the DWR engine by fetching engine.js and extracting
 * the scriptSessionId needed for subsequent calls.
 */
export async function initDwrEngine(): Promise<void> {
  const res = await cisFetch("/Course/dwr/engine.js");
  const js = await res.text();

  // Extract scriptSessionId from engine.js
  // Typical pattern: dwr.engine.setScriptSessionId("xxx");
  const match = js.match(/setScriptSessionId\s*\(\s*["']([^"']+)["']\s*\)/);
  if (match) {
    scriptSessionId = match[1];
  } else {
    // Generate a random one if not found
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    scriptSessionId = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }
}

// ── DWR Call Protocol ─────────────────────────────────────────

/**
 * Make a DWR plain call to a Java service method.
 *
 * DWR plain call format:
 *   POST /Course/dwr/call/plaincall/{ServiceName}.{methodName}.dwr
 *   Content-Type: text/plain
 *
 *   callCount=1
 *   scriptSessionId={id}
 *   c0-scriptName={ServiceName}
 *   c0-methodName={methodName}
 *   c0-id=0
 *   c0-param0=string:{arg0}
 *   ...
 *   batchId=1
 *
 * Response format:
 *   //|骄|0|4|... (DWR proprietary format)
 */
async function dwrCall(
  serviceName: string,
  methodName: string,
  params: unknown[],
): Promise<string> {
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

  // Parse DWR response
  // DWR responses look like:
  //   //|骄|0|4|return-value|...|0|骄|
  // The actual return value is between specific markers
  const returnValueMatch = text.match(/\|4\|([^|]*)\|/);
  if (returnValueMatch) {
    return returnValueMatch[1];
  }

  // Try alternative parsing — sometimes the response has s0= prefix
  const s0Match = text.match(/s0=(.*)/);
  if (s0Match) {
    return s0Match[1];
  }

  return text;
}

// ── Course Data API ───────────────────────────────────────────

/**
 * Get course data for a specific serial number via DWR.
 * This is the same call the CIS frontend makes.
 *
 * Response array: [title, serial, classNo, teacher, status, classTimes, classTimesAlt, credit]
 */
export async function getCourseDataArray(
  serialNo: string,
): Promise<DwrCourseData | null> {
  const raw = await dwrCall("SelectCourseService", "getCourseDataArray", [
    serialNo,
  ]);

  try {
    // DWR serializes arrays as: ["val1","val2",...]
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
}

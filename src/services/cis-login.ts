/**
 * CIS Session Management
 *
 * Does NOT handle login credentials. The user provides a JSESSIONID
 * obtained from their own browser's DevTools.
 *
 * Validation uses a server-side endpoint (/ncu/cis/validate) that
 * makes the HTTP request to CIS from Node.js, avoiding browser
 * CORS and opaque-redirect issues.
 */

const CIS_SESSION_KEY = "cis_session";

export function getCisSession(): string | null {
  return localStorage.getItem(CIS_SESSION_KEY);
}

export function isCisLoggedIn(): boolean {
  return getCisSession() !== null;
}

export function setCisSession(sessionId: string): void {
  localStorage.setItem(CIS_SESSION_KEY, sessionId);
}

export function cisLogout(): void {
  localStorage.removeItem(CIS_SESSION_KEY);
}

/**
 * Sanitize raw pasted JSESSIONID string.
 * Handles cases like:
 * - "JSESSIONID=7DFF50FF6F2B55531B6A803D2DEAEF4C"
 * - "Cookie: JSESSIONID=7DFF50FF...; path=/"
 * - "\"7DFF50FF...\""
 * - Leading / trailing whitespace
 */
export function sanitizeJsessionId(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();

  // If user pasted a cookie header or full key-value pair
  const cookieMatch = clean.match(/(?:^|;\s*|\b)JSESSIONID=([^;\s"']+)/i);
  if (cookieMatch) {
    clean = cookieMatch[1];
  } else {
    // Remove quotes and trailing semicolons/attributes if pasted directly
    clean = clean.replace(/^["']|["']$/g, "").split(";")[0].trim();
  }

  return clean;
}

/**
 * Validate JSESSIONID format locally before making network requests.
 * Tomcat session IDs are typically 32-character hexadecimal or alphanumeric strings,
 * optionally with a node identifier (e.g. .jvm1 or .node1).
 */
export function validateJsessionIdFormat(raw: string): { valid: boolean; error?: string } {
  const clean = sanitizeJsessionId(raw);
  if (!clean) {
    return { valid: false, error: "請輸入 JSESSIONID" };
  }

  // Check length: Tomcat sessions are at least 16 chars and up to 64 chars
  if (clean.length < 16 || clean.length > 64) {
    return {
      valid: false,
      error: `JSESSIONID 長度不符（目前 ${clean.length} 碼，標準通常為 32 碼英數字元）`,
    };
  }

  // Check character set: only alphanumeric, dash, underscore, or dot
  if (!/^[a-zA-Z0-9._-]+$/.test(clean)) {
    return {
      valid: false,
      error: "JSESSIONID 包含不合法字元（僅能包含英數字、點、減號或底線）",
    };
  }

  return { valid: true };
}

/**
 * Validate a JSESSIONID via the server-side /ncu/cis/validate endpoint.
 * Performs client-side format validation first, then makes the request.
 */
export async function cisLogin(
  rawSessionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const formatCheck = validateJsessionIdFormat(rawSessionId);
  if (!formatCheck.valid) {
    return { ok: false, error: formatCheck.error };
  }

  const sessionId = sanitizeJsessionId(rawSessionId);
  try {
    const res = await fetch(
      `/ncu/cis/validate?jsessionid=${encodeURIComponent(sessionId)}`,
    );

    if (!res.ok) {
      return { ok: false, error: `驗證請求失敗 (${res.status})` };
    }

    const data = await res.json();
    if (data.valid) {
      setCisSession(sessionId);
      return { ok: true };
    }
    const debug = data.debug ? ` [${JSON.stringify(data.debug)}]` : "";
    return { ok: false, error: (data.error ?? "Session 無效") + debug };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "連線失敗",
    };
  }
}

/**
 * Wrapper around fetch that attaches the CIS session cookie.
 * Uses a custom header (X-CIS-Session) because browsers strip the
 * Cookie header from manual fetch() calls. The Vite proxy rewrites
 * it into a real Cookie header before forwarding to cis.ncu.edu.tw.
 */
export async function cisFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const session = getCisSession();
  if (!session) throw new Error("No CIS session");

  // Prefix with /ncu/cis so the request goes through the Vite proxy
  const proxyPath = path.startsWith("/ncu/cis") ? path : `/ncu/cis${path}`;
  return fetch(proxyPath, {
    ...init,
    credentials: "include",
    headers: {
      ...init?.headers,
      "X-CIS-Session": session,
    },
  });
}

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

export const getCisSession = (): string | null =>
  localStorage.getItem(CIS_SESSION_KEY);

export const isCisLoggedIn = (): boolean => getCisSession() !== null;

export const setCisSession = (sessionId: string): void => {
  localStorage.setItem(CIS_SESSION_KEY, sessionId);
};

export const cisLogout = (): void => {
  localStorage.removeItem(CIS_SESSION_KEY);
};

/**
 * Sanitize raw pasted JSESSIONID string.
 */
export const sanitizeJsessionId = (raw: string): string => {
  if (!raw) return "";
  const clean = raw.trim();
  const cookieMatch = clean.match(/(?:^|;\s*|\b)JSESSIONID=([^;\s"']+)/i);
  if (cookieMatch) {
    return cookieMatch[1];
  }
  return clean.replace(/^["']|["']$/g, "").split(";")[0].trim();
};

/**
 * Validate JSESSIONID format locally before making network requests.
 */
export const validateJsessionIdFormat = (
  raw: string,
): { valid: boolean; error?: string } => {
  const clean = sanitizeJsessionId(raw);
  if (!clean) {
    return { valid: false, error: "請輸入 JSESSIONID" };
  }

  if (clean.length < 16 || clean.length > 64) {
    return {
      valid: false,
      error: `JSESSIONID 長度不符（目前 ${clean.length} 碼，標準通常為 32 碼英數字元）`,
    };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(clean)) {
    return {
      valid: false,
      error: "JSESSIONID 包含不合法字元（僅能包含英數字、點、減號或底線）",
    };
  }

  return { valid: true };
};

const formatSessionError = (data: { error?: string; debug?: unknown }): string => {
  const base = data.error || "Session 無效";
  const debug = data.debug ? ` [${JSON.stringify(data.debug)}]` : "";
  return `${base}${debug}`;
};

const requestSessionValidation = async (
  sessionId: string,
): Promise<{ ok: boolean; error?: string }> => {
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
    return { ok: false, error: formatSessionError(data) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "連線失敗",
    };
  }
};

/**
 * Validate a JSESSIONID via the server-side /ncu/cis/validate endpoint.
 */
export const cisLogin = async (
  rawSessionId: string,
): Promise<{ ok: boolean; error?: string }> => {
  const formatCheck = validateJsessionIdFormat(rawSessionId);
  if (!formatCheck.valid) {
    return { ok: false, error: formatCheck.error };
  }
  const sessionId = sanitizeJsessionId(rawSessionId);
  return await requestSessionValidation(sessionId);
};

/**
 * Wrapper around fetch that attaches the CIS session cookie.
 */
export const cisFetch = async (
  path: string,
  init?: RequestInit,
): Promise<Response> => {
  const session = getCisSession();
  if (!session) throw new Error("No CIS session");

  const proxyPath = path.startsWith("/ncu/cis") ? path : `/ncu/cis${path}`;
  return await fetch(proxyPath, {
    ...init,
    credentials: "include",
    headers: {
      ...init?.headers,
      "X-CIS-Session": session,
    },
  });
};

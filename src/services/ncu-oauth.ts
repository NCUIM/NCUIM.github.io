/**
 * NCU Portal OAuth2 Configuration & PKCE Utilities
 *
 * Endpoints: https://portal.ncu.edu.tw (4th-gen Portal)
 * API docs: https://github.com/NCU-CC/API-Documentation
 */

// ── Configuration ─────────────────────────────────────────────
const PORTAL_BASE = import.meta.env.VITE_NCU_PORTAL_BASE ?? "https://portal.ncu.edu.tw";
const API_BASE = import.meta.env.VITE_NCU_API_BASE ?? "https://api.cc.ncu.edu.tw";

export const NCU_OAUTH = {
  clientId: import.meta.env.VITE_NCU_CLIENT_ID ?? "",
  clientSecret: import.meta.env.VITE_NCU_CLIENT_SECRET ?? "",
  redirectUri:
    import.meta.env.VITE_APP_REDIRECT_URI ??
    `${window.location.origin}/auth/ncu/callback`,
  /** Scopes: what user info we request */
  scope: "identifier,chinese-name,student-id,academy-records",
  /** Portal OAuth2 endpoints */
  authorizationEndpoint: `${PORTAL_BASE}/oauth2/authorization`,
  /**
   * Token endpoint — in dev, proxy through Vite to avoid CORS.
   */
  tokenEndpoint:
    import.meta.env.VITE_NCU_TOKEN_URL ??
    (import.meta.env.DEV
      ? "/ncu/token"
      : `${PORTAL_BASE}/oauth2/token`),
  userInfoEndpoint:
    import.meta.env.VITE_NCU_USERINFO_URL ??
    (import.meta.env.DEV
      ? "/ncu/portal/apis/oauth/v1/info"
      : `${PORTAL_BASE}/apis/oauth/v1/info`),
  /**
   * NCU Course API — proxied in dev to bypass CORS.
   */
  courseApiBase:
    import.meta.env.VITE_NCU_COURSE_API_URL ??
    (import.meta.env.DEV ? "/ncu/api/course/v1" : `${API_BASE}/course/v1`),
} as const;

// ── PKCE Helpers ──────────────────────────────────────────────

const trimTrailingEquals = (s: string): string => {
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 61) {
    end--;
  }
  return s.slice(0, end);
};

const base64urlencode = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) {
    str += String.fromCodePoint(b);
  }
  const base64 = btoa(str).replace(/\+/g, "-").replace(/\//g, "_");
  return trimTrailingEquals(base64);
};

export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlencode(array.buffer);
};

export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlencode(digest);
};

// ── State Encoding (storage-free PKCE) ────────────────────────

/**
 * Encode a CSRF nonce + PKCE code_verifier into a single state string.
 * Format: `base64url(nonce:verifier)` — compact and safe for URL params.
 */
export const encodeState = (verifier: string): string => {
  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const payload = `${nonce}:${verifier}`;
  const base64 = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_");
  return trimTrailingEquals(base64);
};

/**
 * Decode the state string returned by the authorization server.
 * Returns the PKCE code_verifier, or null if the state is malformed.
 */
export const decodeState = (state: string): string | null => {
  try {
    let padded = state.replace(/-/g, "+").replace(/_/g, "/");
    while (padded.length % 4 !== 0) padded += "=";
    const decoded = atob(padded);
    const colonIdx = decoded.indexOf(":");
    if (colonIdx < 0) return null;
    return decoded.slice(colonIdx + 1);
  } catch {
    return null;
  }
};

// ── Token Storage ─────────────────────────────────────────────
const STORAGE_KEY_AUTH = "app_auth_data";
const STORAGE_KEY_EXPIRY = "app_auth_ttl";

export const saveToken = (accessToken: string, expiresIn: number): void => {
  localStorage.setItem(STORAGE_KEY_AUTH, accessToken);
  localStorage.setItem(STORAGE_KEY_EXPIRY, String(Date.now() + expiresIn * 1000));
};

export const getAccessToken = (): string | null => {
  const expiry = Number(localStorage.getItem(STORAGE_KEY_EXPIRY) ?? 0);
  if (Date.now() > expiry) {
    clearToken();
    return null;
  }
  return localStorage.getItem(STORAGE_KEY_AUTH);
};

export const clearToken = (): void => {
  localStorage.removeItem(STORAGE_KEY_AUTH);
  localStorage.removeItem(STORAGE_KEY_EXPIRY);
};

export const isLoggedIn = (): boolean => getAccessToken() !== null;

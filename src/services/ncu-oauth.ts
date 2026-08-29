/**
 * NCU Portal OAuth2 Configuration & PKCE Utilities
 *
 * Endpoints: https://portal.ncu.edu.tw (4th-gen Portal)
 * API docs: https://github.com/NCU-CC/API-Documentation
 */

// ── Configuration ─────────────────────────────────────────────
// These values come from registering an app at NCU Portal.
// Set VITE_NCU_CLIENT_ID and VITE_NCU_CLIENT_SECRET in .env.
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
   * The Vite dev server proxies /ncu/token → portal.ncu.edu.tw/oauth2/token.
   * In production, use a real backend proxy or set VITE_NCU_TOKEN_URL directly.
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
   * Requires campus network (VPN) for the upstream to be reachable.
   */
  courseApiBase:
    import.meta.env.VITE_NCU_COURSE_API_URL ??
    (import.meta.env.DEV ? "/ncu/api/course/v1" : `${API_BASE}/course/v1`),
} as const;

// ── PKCE Helpers ──────────────────────────────────────────────

function base64urlencode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlencode(array.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlencode(digest);
}

// ── State Encoding (storage-free PKCE) ────────────────────────
// Instead of relying on localStorage/sessionStorage (which are cleared
// during OAuth redirects in some environments), we pack the PKCE
// code_verifier into the OAuth state parameter.  The spec mandates
// the authorization server return state unchanged, so the verifier
// survives the round-trip without any client-side storage.

/**
 * Encode a CSRF nonce + PKCE code_verifier into a single state string.
 * Format: `base64url(nonce:verifier)` — compact and safe for URL params.
 */
export function encodeState(verifier: string): string {
  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const payload = `${nonce}:${verifier}`;
  return btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode the state string returned by the authorization server.
 * Returns the PKCE code_verifier, or null if the state is malformed.
 */
export function decodeState(state: string): string | null {
  try {
    // Restore base64 padding
    let padded = state.replace(/-/g, "+").replace(/_/g, "/");
    while (padded.length % 4 !== 0) padded += "=";
    const decoded = atob(padded);
    const colonIdx = decoded.indexOf(":");
    if (colonIdx < 0) return null;
    return decoded.slice(colonIdx + 1);
  } catch {
    return null;
  }
}

// ── Token Storage ─────────────────────────────────────────────
// localStorage key names (not actual credentials)
const TOKEN_KEY = "ncu_jwt";
const TOKEN_EXPIRY_KEY = "ncu_jwt_exp";

export function saveToken(accessToken: string, expiresIn: number): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
}

export function getAccessToken(): string | null {
  const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) ?? 0);
  if (Date.now() > expiry) {
    clearToken();
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

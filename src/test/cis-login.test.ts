import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeJsessionId,
  validateJsessionIdFormat,
  cisLogin,
  getCisSession,
  setCisSession,
  cisLogout,
  isCisLoggedIn,
} from "../services/cis-login";

const SAMPLE_SESSION = "7DFF50FF6F2B55531B6A803D2DEAEF4C";

describe("cis-login service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("sanitizeJsessionId", () => {
    it.each([
      ["", ""],
      ["   ", ""],
      [`  ${SAMPLE_SESSION}  `, SAMPLE_SESSION],
      [`JSESSIONID=${SAMPLE_SESSION}`, SAMPLE_SESSION],
      [`Cookie: other=123; JSESSIONID=${SAMPLE_SESSION}; path=/`, SAMPLE_SESSION],
      [`"${SAMPLE_SESSION}"`, SAMPLE_SESSION],
    ])("sanitizes %s to %s", (input, expected) => {
      expect(sanitizeJsessionId(input)).toBe(expected);
    });
  });

  describe("validateJsessionIdFormat", () => {
    it.each([
      ["", "請輸入 JSESSIONID"],
      ["12345", "長度不符"],
      [`${SAMPLE_SESSION}@#$`, "包含不合法字元"],
    ])("rejects invalid input %s with expected error", (input, expectedError) => {
      const res = validateJsessionIdFormat(input);
      expect(res.valid).toBe(false);
      expect(res.error).toContain(expectedError);
    });

    it.each([SAMPLE_SESSION, `${SAMPLE_SESSION}.jvm1`])(
      "accepts valid format %s",
      (input) => {
        const res = validateJsessionIdFormat(input);
        expect(res.valid).toBe(true);
        expect(res.error).toBeUndefined();
      },
    );
  });

  describe("cisLogin", () => {
    const mockFetch = (ok: boolean, body: Record<string, unknown>) =>
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok,
        json: () => Promise.resolve(body),
      } as Response);

    it("fails early without network request if format is invalid", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const result = await cisLogin("invalid");
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("makes network request and saves session when valid", async () => {
      mockFetch(true, { valid: true });
      const result = await cisLogin(SAMPLE_SESSION);
      expect(result.ok).toBe(true);
      expect(getCisSession()).toBe(SAMPLE_SESSION);
      expect(isCisLoggedIn()).toBe(true);
    });

    it("handles server-side invalid session response", async () => {
      mockFetch(true, { valid: false, error: "Session 過期" });
      const result = await cisLogin(SAMPLE_SESSION);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Session 過期");
    });
  });

  describe("session storage functions", () => {
    it("manages session in localStorage", () => {
      expect(isCisLoggedIn()).toBe(false);
      setCisSession("test-token-12345678");
      expect(getCisSession()).toBe("test-token-12345678");
      expect(isCisLoggedIn()).toBe(true);
      cisLogout();
      expect(getCisSession()).toBeNull();
      expect(isCisLoggedIn()).toBe(false);
    });
  });
});

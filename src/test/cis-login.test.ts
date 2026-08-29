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

describe("cis-login service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("sanitizeJsessionId", () => {
    it("returns empty string for empty input", () => {
      expect(sanitizeJsessionId("")).toBe("");
      expect(sanitizeJsessionId("   ")).toBe("");
    });

    it("trims whitespace from standard JSESSIONID", () => {
      expect(sanitizeJsessionId("  7DFF50FF6F2B55531B6A803D2DEAEF4C  ")).toBe(
        "7DFF50FF6F2B55531B6A803D2DEAEF4C",
      );
    });

    it("extracts session ID from key-value format (JSESSIONID=...)", () => {
      expect(
        sanitizeJsessionId("JSESSIONID=7DFF50FF6F2B55531B6A803D2DEAEF4C"),
      ).toBe("7DFF50FF6F2B55531B6A803D2DEAEF4C");
    });

    it("extracts session ID from Cookie header with multiple cookies", () => {
      expect(
        sanitizeJsessionId(
          "Cookie: other=123; JSESSIONID=7DFF50FF6F2B55531B6A803D2DEAEF4C; path=/",
        ),
      ).toBe("7DFF50FF6F2B55531B6A803D2DEAEF4C");
    });

    it("strips wrapping quotes", () => {
      expect(
        sanitizeJsessionId('"7DFF50FF6F2B55531B6A803D2DEAEF4C"'),
      ).toBe("7DFF50FF6F2B55531B6A803D2DEAEF4C");
    });
  });

  describe("validateJsessionIdFormat", () => {
    it("rejects empty string", () => {
      const res = validateJsessionIdFormat("");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("請輸入 JSESSIONID");
    });

    it("rejects strings shorter than 16 characters", () => {
      const res = validateJsessionIdFormat("12345");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("長度不符");
    });

    it("rejects strings containing invalid characters (e.g. spaces, symbols)", () => {
      const res = validateJsessionIdFormat("7DFF50FF6F2B55531B6A803D2DEAEF4C@#$");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("包含不合法字元");
    });

    it("accepts valid 32-character hex session ID", () => {
      const res = validateJsessionIdFormat("7DFF50FF6F2B55531B6A803D2DEAEF4C");
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it("accepts valid session ID with node suffix", () => {
      const res = validateJsessionIdFormat("7DFF50FF6F2B55531B6A803D2DEAEF4C.jvm1");
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  describe("cisLogin", () => {
    const mockFetch = (response: { ok: boolean; body: Record<string, unknown> }) =>
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: response.ok,
        json: async () => response.body,
      } as Response);

    it("fails early without network request if format is invalid", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const result = await cisLogin("invalid");
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("makes network request and saves session when valid", async () => {
      mockFetch({ ok: true, body: { valid: true } });
      const result = await cisLogin("7DFF50FF6F2B55531B6A803D2DEAEF4C");
      expect(result.ok).toBe(true);
      expect(getCisSession()).toBe("7DFF50FF6F2B55531B6A803D2DEAEF4C");
      expect(isCisLoggedIn()).toBe(true);
    });

    it("handles server-side invalid session response", async () => {
      mockFetch({ ok: true, body: { valid: false, error: "Session 過期" } });
      const result = await cisLogin("7DFF50FF6F2B55531B6A803D2DEAEF4C");
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

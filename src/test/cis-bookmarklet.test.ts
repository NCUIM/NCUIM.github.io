import { describe, it, expect } from "vitest";
import {
  generateBookmarkletCode,
  parseBookmarkletPayload,
} from "../services/cis-bookmarklet";
import type { CisCourse } from "../services/cis-course-api";

describe("cis-bookmarklet service", () => {
  describe("generateBookmarkletCode", () => {
    it("generates an executable IIFE bookmarklet with targetUrl and validation", () => {
      const targetUrl = "https://ncuim.github.io/tools/credit";
      const code = generateBookmarkletCode(targetUrl);

      expect(code.startsWith("javascript:(function()")).toBe(true);
      expect(code).toContain("cis.ncu.edu.tw");
      expect(code).toContain("/Course/main/personal/perCrsstatus");
      expect(code).toContain(targetUrl);
      expect(code).toContain("String.fromCodePoint(35)");
      expect(() => new Function(code.replace(/^javascript:/, ""))).not.toThrow();
    });
  });

  describe("parseBookmarkletPayload", () => {
    it("returns null when hash does not contain cis_data parameter", () => {
      expect(parseBookmarkletPayload("")).toBeNull();
      expect(parseBookmarkletPayload("#")).toBeNull();
      expect(parseBookmarkletPayload("#other_param=123")).toBeNull();
    });

    it("returns null when payload is malformed or invalid JSON", () => {
      expect(parseBookmarkletPayload("#cis_data=invalid-json")).toBeNull();
      expect(parseBookmarkletPayload("#cis_data=%E0%A4%A")).toBeNull(); // malformed percent-encoding
    });

    it("parses modern object format payload with current and history courses", () => {
      const sampleCourse: CisCourse = {
        serialNo: "12345",
        classNo: "IM1001",
        name: "計算機概論",
        teacher: "王教授",
        room: "I1-101",
        credit: 3,
        classTimes: ["1-2", "1-3"],
        classTimesAlt: "1-2,1-3",
        status: "ready",
        admitCnt: 50,
        limitCnt: 60,
        waitCnt: 0,
        semester: "1131",
      };

      const payloadObj = {
        current: [sampleCourse],
        history: [sampleCourse],
      };
      const hash = `#cis_data=${encodeURIComponent(JSON.stringify(payloadObj))}`;

      const result = parseBookmarkletPayload(hash);
      expect(result).not.toBeNull();
      expect(result?.currentCourses).toHaveLength(1);
      expect(result?.currentCourses[0].serialNo).toBe("12345");
      expect(result?.historyCourses).toHaveLength(1);
      expect(result?.historyCourses[0].name).toBe("計算機概論");
    });

    it("supports legacy array payload format by populating current courses", () => {
      const sampleCourse: Partial<CisCourse> = {
        serialNo: "99999",
        name: "企業概論",
      };

      const hash = `#cis_data=${encodeURIComponent(JSON.stringify([sampleCourse]))}`;
      const result = parseBookmarkletPayload(hash);

      expect(result).not.toBeNull();
      expect(result?.currentCourses).toHaveLength(1);
      expect(result?.currentCourses[0].serialNo).toBe("99999");
      expect(result?.historyCourses).toEqual([]);
    });

    it("handles hash prefixes with multiple fragment segments safely", () => {
      const payloadObj = { current: [], history: [] };
      const hash = `#/some/route?foo=bar#cis_data=${encodeURIComponent(JSON.stringify(payloadObj))}`;

      const result = parseBookmarkletPayload(hash);
      expect(result).not.toBeNull();
      expect(result?.currentCourses).toEqual([]);
      expect(result?.historyCourses).toEqual([]);
    });
  });
});

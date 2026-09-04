import { describe, expect, it } from "vitest";
import masterSnapshot from "../data/im-master-snapshot.json";
import { getRequiredFact, REQUIRED_COURSE_FACTS } from "../data/im-curriculum";

/**
 * Offline (no-network) invariants over the committed curriculum snapshot.
 * The snapshot is the CIS-derived source of truth for the master list (see
 * scripts/reconcile-curriculum.mjs); these tests pin the contract between the
 * snapshot and the curriculum facts so a stale or hand-edited snapshot fails
 * the normal `npm test` run instead of only the scheduled drift check.
 */

interface SnapshotEntry {
  readonly classNo?: string;
  readonly title?: string;
  readonly credit?: number;
  readonly room?: string;
  readonly courseType?: string;
  readonly allowMaster?: boolean;
}

const entries = Object.values(masterSnapshot.courses) as SnapshotEntry[];
const masterEntries = entries.filter((c) => c.allowMaster === true);

describe("im-master-snapshot.json", () => {
  it("records a well-formed semester and a non-empty course set", () => {
    expect(masterSnapshot.semester).toMatch(/^\d{4}$/);
    expect(typeof masterSnapshot.generatedAt).toBe("string");
    expect(entries.length).toBeGreaterThan(40);
  });

  it("has schema-valid entries", () => {
    for (const c of entries) {
      expect(typeof c.classNo).toBe("string");
      expect(typeof c.title).toBe("string");
      expect(typeof c.allowMaster).toBe("boolean");
      expect(["REQUIRED", "ELECTIVE"]).toContain(c.courseType);
    }
  });

  it("master-eligible set excludes doctoral and in-service (IM7043/IM8xxx/IMAxxx)", () => {
    expect(entries.length).toBeGreaterThan(masterEntries.length);
    for (const c of masterEntries) {
      // 資管博士班-only courses and the 碩士在職專班 IMA series must never
      // reach the master's timetable via the snapshot.
      expect(c.classNo).not.toMatch(/^IM704[34]/);
      expect(c.classNo).not.toMatch(/^IM8\d{3}/);
      expect(c.classNo).not.toMatch(/^IMA/);
    }
    // The known doctoral 書報研討Ⅰ sits in the IM7xxx band and must be marked
    // not master-eligible, while 智慧型資訊系統 (IM7082) must stay eligible.
    expect(masterEntries.some((c) => c.classNo?.startsWith("IM7043"))).toBe(false);
    expect(masterEntries.some((c) => c.classNo?.startsWith("IM7082"))).toBe(true);
  });

  it("CIS-REQUIRED master courses resolve to a common (所必修) fact", () => {
    const requiredMaster = masterEntries.filter((c) => c.courseType === "REQUIRED");
    expect(requiredMaster.length).toBeGreaterThan(0);
    for (const c of requiredMaster) {
      const fact = getRequiredFact(c.classNo ?? "");
      expect(fact, `${c.classNo} is REQUIRED in CIS but has no required fact`).not.toBeNull();
      expect(fact?.scope).toBe("common");
    }
  });

  it("common-required facts present this term appear as CIS-REQUIRED master courses", () => {
    const commonCodes = REQUIRED_COURSE_FACTS.filter((f) => f.scope === "common").map(
      (f) => f.code,
    );
    for (const code of commonCodes) {
      const entry = masterEntries.find((c) => c.classNo?.startsWith(code));
      // Spring-term facts (一下/二下, e.g. IM5026 書報研討) are legitimately
      // absent from this fall snapshot — only assert courses that opened.
      if (entry) {
        expect(entry.courseType, `${code} is common-required but not REQUIRED in CIS`).toBe(
          "REQUIRED",
        );
      }
    }
  });

  it("master-eligible courses carry a room and required tags stay consistent", () => {
    for (const c of masterEntries) {
      expect(c.room, `${c.classNo} has no CIS room`).toBeTruthy();
      const fact = getRequiredFact(c.classNo ?? "");
      if (c.courseType === "ELECTIVE" && fact) {
        // 組必修 (管必/系必) are legitimately ELECTIVE in CIS — only common
        // facts must coincide with the CIS REQUIRED flag.
        expect(fact.scope).not.toBe("common");
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import { parseCisCourseStatusPage } from "../services/cis-course-api";

describe("parseCisCourseStatusPage", () => {
  it("keeps actual course results and drops the duplicated bilingual table", () => {
    const html = `
      <table><tr><td>1</td><td>43032</td><td>IM6003</td><td>*</td><td>軟體工程Ⅰ Software Engineering I</td><td>許智誠</td><td>3</td><td>必修</td></tr></table>
      <table><tr><td>1</td><td>43032</td><td>IM6003</td><td>*</td><td>軟體工程Ⅰ Software Engineering I</td><td>許智誠</td><td>3</td><td>必修</td></tr></table>`;

    expect(parseCisCourseStatusPage(html, "1141")).toEqual([
      expect.objectContaining({ classNo: "IM6003", name: "軟體工程Ⅰ", semester: "1141" }),
    ]);
  });
});

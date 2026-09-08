import { describe, expect, it } from "vitest";
// @ts-expect-error - import mjs script in test environment
import { parseFacultyHtml } from "../../scripts/sync-faculty.mjs";

describe("sync-faculty HTML parser", () => {
  const sampleHtml = `
    <table class="table table-striped table-dark teacher-table">
      <tr>
        <td>
          <div class="an">
            <span class="glyphicon glyphicon-user"></span>&nbsp
            測試教授&nbsp&nbsp教授&nbsp兼 測試主任
          </div>
          <img class="t_img" src="https://im.mgt.ncu.edu.tw/img/teacher/test_prof.jpg">
          <table>
            <tr>
              <th>學歷</th>
              <td class="ba_comment">國立中央大學資訊管理學系博士</td>
            </tr>
            <tr>
              <th>專長</th>
              <td class="ba_comment">人工智慧、機器學習、數據分析</td>
            </tr>
            <tr>
              <th>辦公室</th>
              <td class="ba_comment">I1-999</td>
            </tr>
            <tr>
              <th>E-Mail</th>
              <td><a href="mailto:testprof@mgt.ncu.edu.tw">testprof@mgt.ncu.edu.tw</a></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  it("extracts teacher attributes accurately from HTML snippet", () => {
    const parsed = parseFacultyHtml(sampleHtml);
    expect(parsed).toHaveLength(1);

    const teacher = parsed[0];
    expect(teacher.id).toBe("testprof");
    expect(teacher.name).toBe("測試教授");
    expect(teacher.title).toBe("教授");
    expect(teacher.role).toBe("兼 測試主任");
    expect(teacher.photoUrl).toBe("https://im.mgt.ncu.edu.tw/img/teacher/test_prof.jpg");
    expect(teacher.education).toBe("國立中央大學資訊管理學系博士");
    expect(teacher.specialty).toBe("人工智慧、機器學習、數據分析");
    expect(teacher.specialtyTags).toEqual(["人工智慧", "機器學習", "數據分析"]);
    expect(teacher.office).toBe("I1-999");
    expect(teacher.email).toBe("testprof@mgt.ncu.edu.tw");
    expect(teacher.localPhotoUrl).toBe("/teachers/testprof.jpg");
  });

  it("handles empty or malformed HTML gracefully", () => {
    expect(parseFacultyHtml("<div>no tables</div>")).toEqual([]);
  });
});

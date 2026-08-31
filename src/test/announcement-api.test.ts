import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  extractFormField,
  parseGitHubIssue,
  sortAnnouncements,
  fetchAnnouncements,
  GitHubIssue,
  BUILTIN_ANNOUNCEMENTS,
} from "../services/announcement-api";

describe("Announcement API Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("extracts form field correctly from issue markdown body", () => {
    const body = `### 公告類別 (Category)
📚 選課與學分 (category:course)

### 重要程度 (Priority)
🚨 緊急置頂 (priority:urgent)

### 發布單位與署名 (Author & Role)
資管所所代 · 阿駿

### 公告內文 (Content)
請注意選課時間截止日！

### 相關連結 (Action URL)
https://portal.ncu.edu.tw/`;

    expect(
      extractFormField(body, /###\s+(?:發布單位與署名|Author\s*&\s*Role)[^\n]*/i),
    ).toBe("資管所所代 · 阿駿");

    expect(
      extractFormField(body, /###\s+(?:公告內文|Content)[^\n]*/i),
    ).toBe("請注意選課時間截止日！");

    expect(
      extractFormField(body, /###\s+(?:相關連結|Action\s*URL)[^\n]*/i),
    ).toBe("https://portal.ncu.edu.tw/");
  });

  it("parses raw GitHub Issue into AnnouncementItem", () => {
    const mockIssue: GitHubIssue = {
      id: 123456,
      number: 42,
      title: "📢 [公告] 115學年度新生選課通知",
      created_at: "2026-09-01T10:00:00Z",
      updated_at: "2026-09-01T10:00:00Z",
      html_url: "https://github.com/ncuim-github-io/NCUIM2026-Fresher/issues/42",
      labels: [{ name: "announcement" }, { name: "category:course" }, { name: "priority:urgent" }],
      milestone: {
        title: "115-1 新生入學階段",
        due_on: "2026-09-06T16:00:00Z",
      },
      user: { login: "leader-chun" },
      body: `### 發布單位與署名 (Author & Role)
系辦公室 / 助教小華

### 公告內文 (Content)
初選將於明日開放登記，請準時填寫志願。

### 相關連結 (Action URL)
https://cis.ncu.edu.tw/`,
    };

    const parsed = parseGitHubIssue(mockIssue);
    expect(parsed.id).toBe("gh-issue-42");
    expect(parsed.title).toBe("115學年度新生選課通知");
    expect(parsed.category).toBe("course");
    expect(parsed.priority).toBe("urgent");
    expect(parsed.role).toBe("系辦公室");
    expect(parsed.author).toBe("助教小華");
    expect(parsed.content).toBe("初選將於明日開放登記，請準時填寫志願。");
    expect(parsed.actionUrl).toBe("https://cis.ncu.edu.tw/");
    expect(parsed.milestone?.title).toBe("115-1 新生入學階段");
    expect(parsed.milestone?.dueOn).toBe("2026/09/06");
  });

  it("sorts announcements by priority and date", () => {
    const items = [
      {
        id: "1",
        title: "普通公告",
        content: "c",
        author: "a",
        role: "r",
        date: "2026/09/01",
        category: "general" as const,
        priority: "normal" as const,
      },
      {
        id: "2",
        title: "緊急公告",
        content: "c",
        author: "a",
        role: "r",
        date: "2026/08/30",
        category: "general" as const,
        priority: "urgent" as const,
      },
      {
        id: "3",
        title: "重要提醒",
        content: "c",
        author: "a",
        role: "r",
        date: "2026/09/02",
        category: "general" as const,
        priority: "high" as const,
      },
    ];

    const sorted = sortAnnouncements(items);
    expect(sorted[0].id).toBe("2"); // urgent first
    expect(sorted[1].id).toBe("3"); // high second
    expect(sorted[2].id).toBe("1"); // normal third
  });

  it("falls back to empty array when network fails and no cache exists", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const res = await fetchAnnouncements({ forceRefresh: true });
    expect(res).toEqual([]);
  });

  it("returns cached announcements when available", async () => {
    const mockCached = [
      {
        id: "cached-1",
        title: "快取公告",
        content: "內容",
        author: "作者",
        role: "身分",
        date: "2026/09/01",
        category: "general" as const,
        priority: "normal" as const,
      },
    ];
    window.localStorage.setItem(
      "ncuim_announcements_cache_v1",
      JSON.stringify({ timestamp: Date.now(), data: mockCached }),
    );

    const res = await fetchAnnouncements();
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("cached-1");
  });
});

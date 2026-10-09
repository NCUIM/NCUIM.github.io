import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AnnouncementsPage from "../pages/AnnouncementsPage";
import DepartmentNewsModal from "../components/announcements/DepartmentNewsModal";
import * as newsApi from "../services/department-news-api";

vi.mock("@ionic/react", async () => {
  const actual = await vi.importActual<typeof import("@ionic/react")>("@ionic/react");
  return {
    ...actual,
    IonModal: ({ children, isOpen }: any) =>
      isOpen ? <div data-testid="ion-modal">{children}</div> : null,
  };
});

describe("AnnouncementsPage & DepartmentNewsModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockNewsResponse: newsApi.DepartmentNewsResponse = {
    category: "最新消息",
    page: 1,
    total: 2,
    items: [
      {
        id: "9518",
        title: "【重要】115學年度入學碩士班必修科目表",
        url: "https://im.mgt.ncu.edu.tw/homes/9518/post",
        tag: "重要",
        category: "最新消息",
      },
      {
        id: "9520",
        title: "系友講座公告：大數據與雲端應用",
        url: "https://im.mgt.ncu.edu.tw/homes/9520/post",
        tag: "講座",
        category: "最新消息",
      },
    ],
  };

  const mockDetail: newsApi.DepartmentNewsDetail = {
    id: "9518",
    title: "【重要】115學年度入學碩士班必修科目表",
    date: "2026-10-08",
    contentHtml: "<p>本篇公告為碩士班必修科目表內容。</p>",
    attachments: [
      {
        name: "科目表下載.pdf",
        url: "https://im.mgt.ncu.edu.tw/uploads/course.pdf",
      },
    ],
    originalUrl: "https://im.mgt.ncu.edu.tw/homes/9518/post",
  };

  it("renders AnnouncementsPage and loads news items", async () => {
    vi.spyOn(newsApi, "fetchDepartmentNews").mockResolvedValueOnce(mockNewsResponse);

    render(<AnnouncementsPage />);

    expect(screen.getByText("系網即時公告")).toBeDefined();
    expect(screen.getByText("系網公告專區")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("【重要】115學年度入學碩士班必修科目表")).toBeDefined();
      expect(screen.getByText("系友講座公告：大數據與雲端應用")).toBeDefined();
    });
  });

  it("switches category and fetches new items", async () => {
    const fetchSpy = vi
      .spyOn(newsApi, "fetchDepartmentNews")
      .mockResolvedValueOnce(mockNewsResponse)
      .mockResolvedValueOnce({
        category: "課程消息",
        page: 1,
        total: 1,
        items: [
          {
            id: "9600",
            title: "微積分課程異動通知",
            url: "https://im.mgt.ncu.edu.tw/homes/9600/post",
            tag: "課程",
            category: "課程消息",
          },
        ],
      });

    render(<AnnouncementsPage />);

    await waitFor(() => {
      expect(screen.getByText("【重要】115學年度入學碩士班必修科目表")).toBeDefined();
    });

    const courseBtn = screen.getByRole("tab", { name: "課程消息" });
    fireEvent.click(courseBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("課程消息", 1, false);
      expect(screen.getByText("微積分課程異動通知")).toBeDefined();
    });
  });

  it("renders DepartmentNewsModal with post content and attachments", async () => {
    vi.spyOn(newsApi, "fetchDepartmentNewsDetail").mockResolvedValueOnce(mockDetail);

    render(
      <DepartmentNewsModal
        isOpen={true}
        newsId="9518"
        onDismiss={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("公告詳情")).toBeDefined();
      expect(screen.getAllByText("科目表下載.pdf").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("2026-10-08")).toBeDefined();
    });
  });
});

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

    expect(screen.getByText("系網公告")).toBeDefined();

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

  it("renders DepartmentNewsModal with image attachment and toggles image preview", async () => {
    const mockImageDetail: newsApi.DepartmentNewsDetail = {
      id: "9530",
      title: "院週會演講公告",
      date: "2026-10-09",
      contentHtml: "<p>歡迎全系師生參加院週會演講。</p>",
      attachments: [
        {
          name: "演講海報.jpg",
          url: "https://im.mgt.ncu.edu.tw/uploads/poster.jpg",
        },
      ],
      originalUrl: "https://im.mgt.ncu.edu.tw/homes/9530/post",
    };

    vi.spyOn(newsApi, "fetchDepartmentNewsDetail").mockResolvedValueOnce(mockImageDetail);

    render(
      <DepartmentNewsModal
        isOpen={true}
        newsId="9530"
        onDismiss={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("演講海報.jpg")).toBeDefined();
      expect(screen.getByText("圖片檔案 · 線上即時預覽")).toBeDefined();
    });

    // Automatically expanded since content text is short (< 80 chars)
    const imgEl = screen.getByAltText("演講海報.jpg") as HTMLImageElement;
    expect(imgEl).toBeDefined();
    expect(imgEl.src).toBe("https://im.mgt.ncu.edu.tw/uploads/poster.jpg");

    // Toggle collapse
    const collapseBtn = screen.getByText("收合");
    fireEvent.click(collapseBtn);
    expect(screen.queryByAltText("演講海報.jpg")).toBeNull();

    // Toggle expand again
    const previewBtn = screen.getByText("預覽");
    fireEvent.click(previewBtn);
    expect(screen.getByAltText("演講海報.jpg")).toBeDefined();
  });

  it("disables next page button when current page is the last page", async () => {
    vi.spyOn(newsApi, "fetchDepartmentNews").mockResolvedValueOnce({
      category: "最新消息",
      page: 1,
      total: 2,
      items: mockNewsResponse.items,
    });

    render(<AnnouncementsPage />);

    await waitFor(() => {
      expect(screen.getByText("【重要】115學年度入學碩士班必修科目表")).toBeDefined();
    });

    const nextBtn = screen.getByText("下一頁").closest("ion-button") || screen.getByText("下一頁");
    expect(nextBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("identifies attachment as previewable when display name has no extension but URL has image extension", async () => {
    const mockDetailNoExt: newsApi.DepartmentNewsDetail = {
      id: "9531",
      title: "附件海報測試",
      date: "2026-10-09",
      contentHtml: "<p>請點擊下方海報預覽。</p>",
      attachments: [
        {
          name: "活動海報",
          url: "https://im.mgt.ncu.edu.tw/uploads/event_poster.png",
        },
      ],
      originalUrl: "https://im.mgt.ncu.edu.tw/homes/9531/post",
    };

    vi.spyOn(newsApi, "fetchDepartmentNewsDetail").mockResolvedValueOnce(mockDetailNoExt);

    render(
      <DepartmentNewsModal
        isOpen={true}
        newsId="9531"
        onDismiss={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("活動海報")).toBeDefined();
      expect(screen.getByText("圖片檔案 · 線上即時預覽")).toBeDefined();
    });
  });
});


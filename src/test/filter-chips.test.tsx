import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterChips, type FilterChipTab } from "../components/common/FilterChips";

describe("FilterChips", () => {
  const mockTabs: readonly FilterChipTab[] = [
    { id: "all", label: "全部", icon: "grid-outline", iconColor: "#0284c7" },
    { id: "news", label: "最新消息" },
    { id: "events", label: "活動" },
  ];

  it("renders all tabs with correct labels and accessibility roles", () => {
    render(
      <FilterChips
        activeCategory="all"
        onSelectCategory={vi.fn()}
        tabs={mockTabs}
        ariaLabel="測試分類"
      />
    );

    const tablist = screen.getByRole("tablist", { name: "測試分類" });
    expect(tablist).toBeDefined();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0].textContent).toContain("全部");
    expect(tabs[1].textContent).toContain("最新消息");
    expect(tabs[2].textContent).toContain("活動");
  });

  it("exposes the selected state correctly with aria-selected", () => {
    render(
      <FilterChips
        activeCategory="news"
        onSelectCategory={vi.fn()}
        tabs={mockTabs}
      />
    );

    const allTab = screen.getByRole("tab", { name: "全部" });
    const newsTab = screen.getByRole("tab", { name: "最新消息" });
    const eventsTab = screen.getByRole("tab", { name: "活動" });

    expect(newsTab.getAttribute("aria-selected")).toBe("true");
    expect(allTab.getAttribute("aria-selected")).toBe("false");
    expect(eventsTab.getAttribute("aria-selected")).toBe("false");
  });

  it("triggers onSelectCategory callback when a tab is clicked", () => {
    const handleSelect = vi.fn();

    render(
      <FilterChips
        activeCategory="all"
        onSelectCategory={handleSelect}
        tabs={mockTabs}
      />
    );

    const eventsTab = screen.getByRole("tab", { name: "活動" });
    fireEvent.click(eventsTab);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith("events");
  });
});

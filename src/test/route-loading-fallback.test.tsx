import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RouteLoadingFallback from "../components/common/RouteLoadingFallback";

describe("RouteLoadingFallback", () => {
  it("renders loading indicator with accessible busy attribute and role", () => {
    render(<RouteLoadingFallback />);
    const container = screen.getByRole("status", { name: "頁面載入中" });
    expect(container).toBeDefined();
    expect(container.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("載入頁面中…")).toBeDefined();
  });
});

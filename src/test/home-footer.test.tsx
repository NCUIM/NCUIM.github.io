import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeFooter from "../components/home/HomeFooter";

describe("HomeFooter", () => {
  it("renders GitHub stars badge and visitor counter badge side-by-side in a row", () => {
    const { container } = render(<HomeFooter />);

    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer?.style.flexDirection).toBe("row");
    expect(footer?.style.justifyContent).toBe("center");
    expect(footer?.style.flexWrap).toBe("nowrap");

    const link = screen.getByRole("link", { name: "GitHub 專案與 Star" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("https://github.com/NCUIM/NCUIM.github.io");

    const starImg = screen.getByAltText("GitHub Stars") as HTMLImageElement;
    expect(starImg).toBeDefined();
    expect(starImg.src).toContain("shields.io/github/stars/NCUIM/NCUIM.github.io");
    expect(starImg.getAttribute("referrerpolicy")).toBe("no-referrer");

    const visitorImg = screen.getByAltText("Visitors Counter") as HTMLImageElement;
    expect(visitorImg).toBeDefined();
    expect(visitorImg.src).toContain("hits.sh/ncuim.github.io.svg");
    expect(visitorImg.getAttribute("referrerpolicy")).toBe("no-referrer");
  });
});

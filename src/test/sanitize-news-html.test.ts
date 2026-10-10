import { describe, it, expect } from "vitest";
import { sanitizeDepartmentNewsHtml } from "../utils/sanitize-news-html";

describe("sanitizeDepartmentNewsHtml", () => {
  it.each([
    {
      scenario: "removes executable script and svg tags",
      input: '<div>Content <script>alert(1)</script><svg onload="alert(2)"><circle/></svg></div>',
      disallowed: ["<script>", "<svg", "alert"],
      required: ["Content"],
    },
    {
      scenario: "strips inline on-handler attributes",
      input: '<img src="https://example.com/pic.jpg" onerror="alert(1)" onload="alert(2)" onclick="alert(3)" alt="Hero" />',
      disallowed: ["onerror", "onload", "onclick"],
      required: ['src="https://example.com/pic.jpg"', 'alt="Hero"'],
    },
    {
      scenario: "filters pseudo-protocol URLs in hyperlinks",
      input: '<a href="javascript:alert(1)">Evil</a><a href="vbscript:msgbox(1)">VBS</a><a href="https://example.com">Valid</a>',
      disallowed: ["javascript:", "vbscript:"],
      required: ['href="https://example.com"', 'target="_blank"', 'rel="noopener noreferrer"'],
    },
    {
      scenario: "resolves relative links against department host",
      input: '<p><img src="/img/news.png" /><a href="/doc/file">Link</a></p>',
      disallowed: [],
      required: ['src="https://im.mgt.ncu.edu.tw/img/news.png"', 'href="https://im.mgt.ncu.edu.tw/doc/file"'],
    },
  ])("$scenario", ({ input, disallowed, required }) => {
    const output = sanitizeDepartmentNewsHtml(input);
    for (const term of disallowed) {
      expect(output).not.toContain(term);
    }
    for (const term of required) {
      expect(output).toContain(term);
    }
  });

  it("handles formatting and attachment stripping", () => {
    const formatted = sanitizeDepartmentNewsHtml("<p><strong>Bold</strong></p>");
    expect(formatted).toBe("<p><strong>Bold</strong></p>");

    const stripped = sanitizeDepartmentNewsHtml(
      "<div><p>Body text.</p><b>附件：</b><a href='/a.pdf'>A</a></div>",
      { stripAttachmentBlock: true },
    );
    expect(stripped).toContain("Body text.");
    expect(stripped).not.toContain("附件");

    expect(sanitizeDepartmentNewsHtml("")).toBe("");
    // @ts-expect-error test falsy input fallback
    expect(sanitizeDepartmentNewsHtml(null)).toBe("");
  });
});

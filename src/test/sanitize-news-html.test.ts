import { describe, it, expect } from "vitest";
import { sanitizeDepartmentNewsHtml } from "../utils/sanitize-news-html";

describe("sanitizeDepartmentNewsHtml", () => {
  it("removes script tags and executable elements", () => {
    const raw = `<div>Hello <script>alert("XSS")</script><svg onload="alert(1)"><circle cx="5" cy="5" r="5"/></svg></div>`;
    const sanitized = sanitizeDepartmentNewsHtml(raw);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("<svg");
    expect(sanitized).not.toContain("alert");
    expect(sanitized).toContain("Hello");
  });

  it("strips event handler attributes like onerror, onload, and onclick", () => {
    const raw = `<img src="https://example.com/pic.jpg" onerror="alert('pwned')" onload="console.log('loaded')" onclick="doEvil()" alt="Photo" />`;
    const sanitized = sanitizeDepartmentNewsHtml(raw);
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).not.toContain("onload");
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).toContain('src="https://example.com/pic.jpg"');
    expect(sanitized).toContain('alt="Photo"');
  });

  it("blocks dangerous javascript: and data: schemes in href and src", () => {
    const raw = `<a href="javascript:alert(1)">Click me</a><a href="vbscript:msgbox(1)">Click 2</a><a href="https://example.com">Legit</a>`;
    const sanitized = sanitizeDepartmentNewsHtml(raw);
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain("vbscript:");
    expect(sanitized).toContain('href="https://example.com"');
    expect(sanitized).toContain('target="_blank"');
    expect(sanitized).toContain('rel="noopener noreferrer"');
  });

  it("prefixes relative / links and image sources with the department domain", () => {
    const raw = `<p><img src="/upload/news/banner.png" /><a href="/post/123">Read more</a></p>`;
    const sanitized = sanitizeDepartmentNewsHtml(raw);
    expect(sanitized).toContain('src="https://im.mgt.ncu.edu.tw/upload/news/banner.png"');
    expect(sanitized).toContain('href="https://im.mgt.ncu.edu.tw/post/123"');
  });

  it("preserves safe formatting tags such as p, strong, table, br", () => {
    const raw = `<p><strong>Bold</strong> and <em>Italic</em></p><table><tr><td>Cell</td></tr></table>`;
    const sanitized = sanitizeDepartmentNewsHtml(raw);
    expect(sanitized).toContain("<p><strong>Bold</strong> and <em>Italic</em></p>");
    expect(sanitized).toContain("<table><tbody><tr><td>Cell</td></tr></tbody></table>");
  });

  it("strips trailing CMS attachment section when stripAttachmentBlock is true", () => {
    const raw = `<div><p>Main content here.</p><b>附件：</b><a href="/file.pdf">File</a></div>`;
    const sanitized = sanitizeDepartmentNewsHtml(raw, { stripAttachmentBlock: true });
    expect(sanitized).toContain("Main content here.");
    expect(sanitized).not.toContain("附件");
    expect(sanitized).not.toContain("File");
  });

  it("handles null, empty or non-string input safely", () => {
    expect(sanitizeDepartmentNewsHtml("")).toBe("");
    // @ts-expect-error test invalid input
    expect(sanitizeDepartmentNewsHtml(null)).toBe("");
  });
});

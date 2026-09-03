import type React from "react";

export interface ContentSegment {
  readonly type: "text" | "image";
  readonly content: string;
  readonly alt?: string;
}

const SAFE_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp"];
const TRUSTED_DOMAINS = [
  "github.com",
  "githubusercontent.com",
  "raw.githubusercontent.com",
  "user-images.githubusercontent.com",
  "avatars.githubusercontent.com",
  "thanatosjun.com",
  "ncu.edu.tw",
];

/**
 * Validates whether an image URL is secure and safe to render.
 * Strictly requires https: and either trusted origin or verified image extension.
 */
export const isSafeImageUrl = (rawUrl: string): boolean => {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();
    const isTrustedHost = TRUSTED_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    );

    const pathname = parsed.pathname.toLowerCase();
    const hasImageExtension = SAFE_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));

    return isTrustedHost || hasImageExtension;
  } catch {
    return false;
  }
};

/**
 * Parses markdown text into structured text and image segments.
 * Only matches valid https:// image markdown syntax; others remain untouched plain text.
 */
export const parseContentSegments = (text: string): readonly ContentSegment[] => {
  if (!text) return [];

  const segments: ContentSegment[] = [];
  const regex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);

  while (match !== null) {
    const [fullMatch, alt, url] = match;
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, matchStart),
      });
    }

    if (isSafeImageUrl(url)) {
      segments.push({
        type: "image",
        content: url,
        alt: alt || "公告圖片",
      });
    } else {
      segments.push({
        type: "text",
        content: fullMatch,
      });
    }

    lastIndex = matchStart + fullMatch.length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
};

export const AnnouncementContent = ({ content }: Readonly<{ content: string }>) => {
  const segments = parseContentSegments(content);

  return (
    <div style={{ margin: "0 0 14px", lineHeight: 1.7, fontSize: 14 }}>
      {segments.map((seg, idx) => {
        if (seg.type === "image") {
          return (
            <div key={`img-segment-${seg.content}-${idx}`} style={{ margin: "10px 0" }}>
              <a
                href={seg.content}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-block", maxWidth: "100%", cursor: "zoom-in" }}
              >
                <img
                  src={seg.content}
                  alt={seg.alt}
                  loading="lazy"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 480,
                    height: "auto",
                    borderRadius: 8,
                    border: "1px solid var(--ncu-border)",
                    display: "block",
                    boxShadow: "var(--ncu-shadow-sm)",
                  }}
                />
              </a>
              {seg.alt && seg.alt !== "公告圖片" && (
                <span
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "var(--ncu-muted)",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  {seg.alt}
                </span>
              )}
            </div>
          );
        }

        return (
          <p
            key={`text-segment-${idx}`}
            style={{
              margin: "0 0 8px",
              whiteSpace: "pre-line",
              wordBreak: "break-word",
            }}
          >
            {seg.content}
          </p>
        );
      })}
    </div>
  );
};

export default AnnouncementContent;

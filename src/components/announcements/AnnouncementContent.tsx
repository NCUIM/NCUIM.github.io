import React from "react";

export interface ContentSegment {
  readonly id: string;
  readonly type: "text" | "image";
  readonly content: string;
  readonly alt?: string;
  readonly width?: number;
}

export interface InlineSegment {
  readonly id: string;
  readonly type: "text" | "link";
  readonly text: string;
  readonly url?: string;
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
 * Validates whether a hyperlink URL is secure.
 * Strictly accepts https: and http: schemes, disallowing javascript:, data:, etc.
 */
export const isSafeLinkUrl = (rawUrl: string): boolean => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const cleanTrailingPunctuation = (raw: string): { url: string; trailing: string } => {
  const trailingMatch = /[.,;:!?'")\]>、，。！？；：」』）】]+$/.exec(raw);
  if (trailingMatch) {
    return {
      url: raw.slice(0, trailingMatch.index),
      trailing: trailingMatch[0],
    };
  }
  return { url: raw, trailing: "" };
};

/**
 * Parses inline text for markdown links [text](url) and bare URLs https://...
 */
export const parseInlineSegments = (text: string, baseId: string): readonly InlineSegment[] => {
  if (!text) return [];

  const segments: InlineSegment[] = [];
  const regex = /(?:\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<>()]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);

  while (match !== null) {
    const [fullMatch, mdText, mdUrl, bareUrl] = match;
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      segments.push({
        id: `${baseId}-t-${lastIndex}`,
        type: "text",
        text: text.slice(lastIndex, matchStart),
      });
    }

    if (mdUrl && mdText) {
      if (isSafeLinkUrl(mdUrl)) {
        segments.push({
          id: `${baseId}-l-${matchStart}`,
          type: "link",
          text: mdText,
          url: mdUrl,
        });
      } else {
        segments.push({
          id: `${baseId}-t-${matchStart}`,
          type: "text",
          text: fullMatch,
        });
      }
    } else if (bareUrl) {
      const { url: cleanUrl, trailing } = cleanTrailingPunctuation(bareUrl);
      if (isSafeLinkUrl(cleanUrl)) {
        segments.push({
          id: `${baseId}-l-${matchStart}`,
          type: "link",
          text: cleanUrl,
          url: cleanUrl,
        });
        if (trailing) {
          segments.push({
            id: `${baseId}-t-${matchStart + cleanUrl.length}`,
            type: "text",
            text: trailing,
          });
        }
      } else {
        segments.push({
          id: `${baseId}-t-${matchStart}`,
          type: "text",
          text: fullMatch,
        });
      }
    }

    lastIndex = matchStart + fullMatch.length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    segments.push({
      id: `${baseId}-t-${lastIndex}`,
      type: "text",
      text: text.slice(lastIndex),
    });
  }

  return segments;
};

interface ExtractedImage {
  readonly url: string;
  readonly alt?: string;
  readonly width?: number;
}

const parseImageMatch = (match: RegExpExecArray): ExtractedImage => {
  if (match[2]) {
    return {
      url: match[2],
      alt: match[1],
    };
  }
  const attrs = `${match[3] || ""} ${match[5] || ""}`;
  const altMatch = /alt=["']([^"']*)["']/i.exec(attrs);
  const widthMatch = /width=["']?(\d+)["']?/i.exec(attrs);
  return {
    url: match[4],
    alt: altMatch?.[1],
    width: widthMatch ? Number.parseInt(widthMatch[1], 10) : undefined,
  };
};

const IMAGE_REGEX =
  /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|<img\s+([^>]*?)src=["'](https?:\/\/[^"'\s>]+)["']([^>]*?)\/?>/gi;

/**
 * Normalizes raw issue markdown before segment parsing:
 * 1. Collapses <a href="..."><img .../></a> → keeps just <img .../>, discards anchor shell.
 * 2. Converts clickable-image syntax [![alt](img)](link) → ![alt](img), discarding outer link.
 */
const normalizeContent = (raw: string): string =>
  raw
    // Strip <a ...> opening tags (may span multiple attributes)
    .replace(/<a\s[^>]*>/gi, "")
    // Strip </a> closing tags
    .replace(/<\/a>/gi, "")
    // Collapse [![alt](imgUrl)](linkUrl) → ![alt](imgUrl)
    .replace(/\[(!)\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)\]\([^)]*\)/g, "![$2]($3)");

/**
 * Parses markdown text into structured text and image segments.
 * Supports markdown image syntax, clickable image links, and safe HTML img tags.
 */
export const parseContentSegments = (text: string): readonly ContentSegment[] => {
  if (!text) return [];

  const normalized = normalizeContent(text);
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = IMAGE_REGEX.exec(normalized);

  while (match !== null) {
    const [fullMatch] = match;
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      segments.push({
        id: `text-${lastIndex}`,
        type: "text",
        content: normalized.slice(lastIndex, matchStart),
      });
    }

    const img = parseImageMatch(match);

    if (isSafeImageUrl(img.url)) {
      segments.push({
        id: `img-${matchStart}`,
        type: "image",
        content: img.url,
        alt: img.alt || "公告圖片",
        width: img.width,
      });
    } else {
      segments.push({
        id: `text-${matchStart}`,
        type: "text",
        content: fullMatch,
      });
    }

    lastIndex = matchStart + fullMatch.length;
    match = IMAGE_REGEX.exec(normalized);
  }

  if (lastIndex < normalized.length) {
    segments.push({
      id: `text-${lastIndex}`,
      type: "text",
      content: normalized.slice(lastIndex),
    });
  }

  return segments;
};

const TextParagraph = ({
  content,
  segmentId,
}: Readonly<{ content: string; segmentId: string }>) => {
  const inlineNodes = parseInlineSegments(content, segmentId);

  return (
    <p
      style={{
        margin: "0 0 8px",
        whiteSpace: "pre-line",
        wordBreak: "break-word",
      }}
    >
      {inlineNodes.map((item) => {
        if (item.type === "link" && item.url) {
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--ncu-primary, #1e40af)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                fontWeight: 600,
                wordBreak: "break-all",
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span>{item.text}</span>
              <span style={{ fontSize: 11, opacity: 0.85 }}>↗</span>
            </a>
          );
        }
        return <React.Fragment key={item.id}>{item.text}</React.Fragment>;
      })}
    </p>
  );
};

export const AnnouncementContent = ({ content }: Readonly<{ content: string }>) => {
  const segments = parseContentSegments(content);

  return (
    <div style={{ margin: "0 0 14px", lineHeight: 1.7, fontSize: 14 }}>
      {segments.map((seg) => {
        if (seg.type === "image") {
          return (
            <div key={seg.id} style={{ margin: "10px 0" }}>
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
                    width: seg.width ? `${seg.width}px` : "auto",
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
              {seg.alt &&
                seg.alt !== "公告圖片" &&
                seg.alt.toLowerCase() !== "image" && (
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

        return <TextParagraph key={seg.id} content={seg.content} segmentId={seg.id} />;
      })}
    </div>
  );
};

export default AnnouncementContent;

import React from "react";

export interface ContentSegment {
  readonly id: string;
  readonly type: "text" | "image";
  readonly content: string;
  readonly alt?: string;
  readonly width?: number;
  readonly linkUrl?: string;
}

export interface InlineSegment {
  readonly id: string;
  readonly type: "text" | "link";
  readonly text: string;
  readonly url?: string;
}

interface ExtractedImage {
  readonly url: string;
  readonly linkUrl?: string;
  readonly alt?: string;
  readonly width?: number;
}

interface FoundImageToken {
  readonly index: number;
  readonly length: number;
  readonly raw: string;
  readonly image: ExtractedImage;
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

const TRAILING_PUNCTUATION_CHARS = new Set([
  ".",
  ",",
  ";",
  ":",
  "!",
  "?",
  "'",
  '"',
  ")",
  "]",
  ">",
  "、",
  "，",
  "。",
  "！",
  "？",
  "；",
  "：",
  "」",
  "』",
  "）",
  "】",
]);

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
  let end = raw.length;
  while (end > 0 && TRAILING_PUNCTUATION_CHARS.has(raw[end - 1])) {
    end -= 1;
  }
  return {
    url: raw.slice(0, end),
    trailing: raw.slice(end),
  };
};

const appendMarkdownLink = (
  segments: InlineSegment[],
  baseId: string,
  start: number,
  mdText: string,
  mdUrl: string,
  raw: string,
) => {
  if (isSafeLinkUrl(mdUrl)) {
    segments.push({ id: `${baseId}-l-${start}`, type: "link", text: mdText, url: mdUrl });
  } else {
    segments.push({ id: `${baseId}-t-${start}`, type: "text", text: raw });
  }
};

const appendBareUrlLink = (
  segments: InlineSegment[],
  baseId: string,
  start: number,
  bareUrl: string,
  raw: string,
) => {
  const { url: cleanUrl, trailing } = cleanTrailingPunctuation(bareUrl);
  if (!isSafeLinkUrl(cleanUrl)) {
    segments.push({ id: `${baseId}-t-${start}`, type: "text", text: raw });
    return;
  }
  segments.push({ id: `${baseId}-l-${start}`, type: "link", text: cleanUrl, url: cleanUrl });
  if (trailing) {
    segments.push({ id: `${baseId}-t-${start + cleanUrl.length}`, type: "text", text: trailing });
  }
};

const INLINE_BARE_URL_REGEX = /https?:\/\/[^\s<>()]+/;

interface FoundInlineToken {
  readonly fullMatch: string;
  readonly mdText: string | undefined;
  readonly mdUrl: string | undefined;
  readonly index: number;
}

const isInlineWhitespace = (ch: string): boolean =>
  ch === " " ||
  ch === "\t" ||
  ch === "\n" ||
  ch === "\r" ||
  ch === "\v" ||
  ch === "\f" ||
  ch === "\u00a0" ||
  ch === "\ufeff";

const getUrlSchemeLength = (text: string, start: number): number => {
  if (text.startsWith("https://", start)) return 8;
  if (text.startsWith("http://", start)) return 7;
  return 0;
};

const findUrlEnd = (text: string, urlStart: number, schemeLen: number): number => {
  let urlEnd = urlStart + schemeLen;
  while (
    urlEnd < text.length &&
    !isInlineWhitespace(text[urlEnd]) &&
    text[urlEnd] !== ")"
  ) {
    urlEnd += 1;
  }
  return urlEnd;
};

const tryParseMarkdownLink = (
  text: string,
  openIndex: number,
): FoundInlineToken | null => {
  const closeBracket = text.indexOf("]", openIndex + 1);
  if (closeBracket === -1) return null;
  if (text[closeBracket + 1] !== "(") return null;

  const urlStart = closeBracket + 2;
  const schemeLen = getUrlSchemeLength(text, urlStart);
  if (schemeLen === 0) return null;

  const urlEnd = findUrlEnd(text, urlStart, schemeLen);
  if (urlEnd >= text.length || text[urlEnd] !== ")") return null;
  if (urlEnd === urlStart + schemeLen) return null; // URL must have content after the scheme

  return {
    fullMatch: text.slice(openIndex, urlEnd + 1),
    mdText: text.slice(openIndex + 1, closeBracket),
    mdUrl: text.slice(urlStart, urlEnd),
    index: openIndex,
  };
};

/**
 * Linear scan for the next `[text](https?://url)` markdown link.
 * Replaces the old regex whose `[^\]]+` + `\]` pair caused super-linear
 * backtracking on unclosed bracket input (SonarCloud performance issue).
 */
const findNextMarkdownLink = (
  text: string,
  fromIndex: number,
): FoundInlineToken | null => {
  for (let i = fromIndex; i < text.length; i++) {
    if (text[i] !== "[") continue;

    const token = tryParseMarkdownLink(text, i);
    if (token) return token;
    if (text.indexOf("]", i + 1) === -1) return null; // no closing bracket remains → no further links
  }
  return null;
};

const findNextInlineToken = (text: string, fromIndex: number): FoundInlineToken | null => {
  const mdLink = findNextMarkdownLink(text, fromIndex);
  const bareMatch = INLINE_BARE_URL_REGEX.exec(text.slice(fromIndex));

  if (!mdLink && !bareMatch) return null;

  const mdIndex = mdLink ? mdLink.index : Infinity;
  const bareIndex = bareMatch ? fromIndex + bareMatch.index : Infinity;

  if (mdIndex <= bareIndex && mdLink) return mdLink;
  if (bareMatch) {
    return {
      fullMatch: bareMatch[0],
      mdText: undefined,
      mdUrl: undefined,
      index: fromIndex + bareMatch.index,
    };
  }
  return null;
};

/**
 * Parses inline text for markdown links [text](url) and bare URLs https://...
 */
export const parseInlineSegments = (text: string, baseId: string): readonly InlineSegment[] => {
  if (!text) return [];

  const segments: InlineSegment[] = [];
  let lastIndex = 0;

  for (;;) {
    const token = findNextInlineToken(text, lastIndex);
    if (!token) break;

    const { fullMatch, mdText, mdUrl, index: matchStart } = token;

    if (matchStart > lastIndex) {
      segments.push({
        id: `${baseId}-t-${lastIndex}`,
        type: "text",
        text: text.slice(lastIndex, matchStart),
      });
    }

    if (mdUrl && mdText) {
      appendMarkdownLink(segments, baseId, matchStart, mdText, mdUrl, fullMatch);
    } else {
      appendBareUrlLink(segments, baseId, matchStart, fullMatch, fullMatch);
    }

    lastIndex = matchStart + fullMatch.length;
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

const trimEdgeNewlines = (str: string): string => {
  let start = 0;
  while (start < str.length && str[start] === "\n") {
    start += 1;
  }
  let end = str.length;
  while (end > start && str[end - 1] === "\n") {
    end -= 1;
  }
  return str.slice(start, end);
};

const cleanTextSlice = (raw: string): string => {
  const noAnchors = raw.replace(/<a\b[^>]*>/gi, "").replace(/<\/a>/gi, "");
  return trimEdgeNewlines(noAnchors);
};

const parseHtmlImageTag = (tag: string): { url: string; alt?: string; width?: number } => {
  const srcMatch = /src=["'](https?:\/\/[^"'\s>]+)["']/i.exec(tag);
  const altMatch = /alt=["']([^"']*)["']/i.exec(tag);
  const widthMatch = /width=["']?(\d+)["']?/i.exec(tag);
  return {
    url: srcMatch ? srcMatch[1] : "",
    alt: altMatch?.[1],
    width: widthMatch ? Number.parseInt(widthMatch[1], 10) : undefined,
  };
};

const LINKED_MD_IMG_REGEX = /\[!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)\]\((https?:\/\/[^\s)]+)\)/;
const STANDALONE_MD_IMG_REGEX = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/;
const LINKED_HTML_IMG_REGEX = /<a\b[^>]*?href=["'](https?:\/\/[^"'\s>]+)["'][^>]*>\s*(<img\b[^>]*>)\s*<\/a>/i;
const STANDALONE_HTML_IMG_REGEX = /<img\b[^>]*\/?>/i;

const findNextImageToken = (source: string, fromIndex: number): FoundImageToken | null => {
  const sub = source.slice(fromIndex);
  let best: FoundImageToken | null = null;

  const check = (regex: RegExp, extractFn: (m: RegExpExecArray) => ExtractedImage) => {
    const m = regex.exec(sub);
    if (m) {
      const idx = fromIndex + m.index;
      if (!best || idx < best.index) {
        best = {
          index: idx,
          length: m[0].length,
          raw: m[0],
          image: extractFn(m),
        };
      }
    }
  };

  check(LINKED_MD_IMG_REGEX, (m) => ({ url: m[2], linkUrl: m[3], alt: m[1] }));
  check(LINKED_HTML_IMG_REGEX, (m) => {
    const htmlInfo = parseHtmlImageTag(m[2]);
    return { ...htmlInfo, linkUrl: m[1] };
  });
  check(STANDALONE_MD_IMG_REGEX, (m) => ({ url: m[2], alt: m[1] }));
  check(STANDALONE_HTML_IMG_REGEX, (m) => parseHtmlImageTag(m[0]));

  return best;
};

const appendTextSegment = (
  segments: ContentSegment[],
  rawText: string,
  startOffset: number,
) => {
  const clean = cleanTextSlice(rawText);
  if (clean.length > 0) {
    segments.push({
      id: `text-${startOffset}`,
      type: "text",
      content: clean,
    });
  }
};

const appendImageSegment = (
  segments: ContentSegment[],
  img: ExtractedImage,
  startOffset: number,
  fallbackRaw: string,
) => {
  if (isSafeImageUrl(img.url)) {
    const validLink = img.linkUrl && isSafeLinkUrl(img.linkUrl) ? img.linkUrl : undefined;
    segments.push({
      id: `img-${startOffset}`,
      type: "image",
      content: img.url,
      linkUrl: validLink,
      alt: img.alt || "公告圖片",
      width: img.width,
    });
  } else {
    segments.push({
      id: `text-${startOffset}`,
      type: "text",
      content: fallbackRaw,
    });
  }
};

/**
 * Parses markdown text into structured text and image segments.
 * Supports standalone and linked markdown images, safe HTML img tags, and stripping orphaned markup.
 */
export const parseContentSegments = (text: string): readonly ContentSegment[] => {
  if (!text) return [];

  const segments: ContentSegment[] = [];
  let lastIndex = 0;

  while (lastIndex < text.length) {
    const token = findNextImageToken(text, lastIndex);
    if (!token) {
      break;
    }

    if (token.index > lastIndex) {
      appendTextSegment(segments, text.slice(lastIndex, token.index), lastIndex);
    }

    appendImageSegment(segments, token.image, token.index, token.raw);
    lastIndex = token.index + token.length;
  }

  if (lastIndex < text.length) {
    appendTextSegment(segments, text.slice(lastIndex), lastIndex);
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

const resolveImageDimensions = (
  seg: ContentSegment,
  isQrOrInvite: boolean,
): { width?: string; maxWidth: string } => {
  if (seg.width) {
    const px = `${seg.width}px`;
    return { width: px, maxWidth: px };
  }
  if (isQrOrInvite) {
    return { width: "120px", maxWidth: "120px" };
  }
  return { width: undefined, maxWidth: "100%" };
};

export const AnnouncementContent = ({ content }: Readonly<{ content: string }>) => {
  const segments = parseContentSegments(content);

  return (
    <div style={{ margin: "0 0 14px", lineHeight: 1.7, fontSize: 14 }}>
      {segments.map((seg) => {
        if (seg.type === "image") {
          const isQrOrInvite =
            Boolean(seg.alt && /qr|條碼|群組/i.test(seg.alt)) ||
            Boolean(seg.linkUrl && /line\.me/i.test(seg.linkUrl));

          const { width: displayWidth, maxWidth } = resolveImageDimensions(seg, isQrOrInvite);

          const imgNode = (
            <img
              src={seg.content}
              alt={seg.alt}
              loading="lazy"
              style={{
                width: displayWidth || "auto",
                maxWidth,
                maxHeight: 360,
                height: "auto",
                borderRadius: 8,
                border: "1px solid var(--ncu-border)",
                display: "block",
                boxShadow: "var(--ncu-shadow-sm)",
              }}
            />
          );

          return (
            <div
              key={seg.id}
              style={{
                margin: "8px 0 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {seg.linkUrl ? (
                <a
                  href={seg.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  {imgNode}
                </a>
              ) : (
                imgNode
              )}
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

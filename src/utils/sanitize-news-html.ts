/**
 * Secure HTML Sanitizer for Department News Content.
 *
 * Scraped announcement content from the department website may contain rich text,
 * tables, and images. This sanitizer uses the browser's DOMParser to enforce a strict
 * tag allowlist, strip all event-handler attributes (e.g. onerror, onload), disallow
 * dangerous schemes (javascript:, vbscript:, data:), and prefix relative URLs with
 * the department host.
 */

const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "p",
  "div",
  "span",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "blockquote",
  "pre",
  "code",
  "img",
  "font",
]);

const DANGEROUS_SCHEMES = ["javascript:", "vbscript:", "data:"];

function stripRawAttachmentBlock(doc: Document): void {
  const bTags = Array.from(doc.body.querySelectorAll("b, strong"));
  for (const b of bTags) {
    if (/^\s*附件[：:]/i.test(b.textContent || "")) {
      let sibling: ChildNode | null = b;
      while (sibling) {
        const next: ChildNode | null = sibling.nextSibling as ChildNode | null;
        sibling.remove();
        sibling = next;
      }
      break;
    }
  }
}

function cleanUrlAttribute(el: HTMLElement, attrName: string, val: string): void {
  const trimmed = val.trim().toLowerCase();
  const hasDangerousScheme = DANGEROUS_SCHEMES.some((scheme) =>
    trimmed.startsWith(scheme),
  );

  if (hasDangerousScheme) {
    el.removeAttribute(attrName);
    return;
  }

  // Prefix relative URLs with the official department website host
  if (val.startsWith("/") && !val.startsWith("//")) {
    el.setAttribute(attrName, `https://im.mgt.ncu.edu.tw${val}`);
  }
}

function cleanStyleAttribute(el: HTMLElement, attrName: string, val: string): void {
  if (/expression|javascript:|behavior/i.test(val)) {
    el.removeAttribute(attrName);
  }
}

function cleanElementAttributes(el: HTMLElement): void {
  const attrs = Array.from(el.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    const val = attr.value;

    if (name.startsWith("on")) {
      el.removeAttribute(attr.name);
    } else if (name === "href" || name === "src") {
      cleanUrlAttribute(el, attr.name, val);
    } else if (name === "style") {
      cleanStyleAttribute(el, attr.name, val);
    }
  }
}

function cleanNode(node: Node): void {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  // Disallow active or non-whitelisted elements
  if (!ALLOWED_TAGS.has(tag)) {
    el.remove();
    return;
  }

  cleanElementAttributes(el);

  // Enforce safe link target and rel attributes on anchor tags
  if (tag === "a") {
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  }

  // Recursively clean all children
  const children = Array.from(el.childNodes);
  for (const child of children) {
    cleanNode(child);
  }
}

/**
 * Sanitizes rich HTML from department news detail and normalizes asset URLs.
 */
export function sanitizeDepartmentNewsHtml(
  rawHtml: string,
  options?: { readonly stripAttachmentBlock?: boolean },
): string {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  if (typeof DOMParser === "undefined") {
    return "";
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // Optionally strip trailing raw CMS attachment block if structured attachments exist
  if (options?.stripAttachmentBlock) {
    stripRawAttachmentBlock(doc);
  }

  const bodyChildren = Array.from(doc.body.childNodes);
  for (const child of bodyChildren) {
    cleanNode(child);
  }

  return doc.body.innerHTML;
}

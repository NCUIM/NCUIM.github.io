#!/usr/bin/env node
/**
 * Sync NCU IM faculty members from the official department website.
 *
 * Source:
 *   https://im.mgt.ncu.edu.tw/teacher
 *
 * Outputs:
 *   - src/data/im-teachers.json (Metadata snapshot)
 *   - public/teachers/<id>.jpg (Local portrait images to avoid CORS during 3D point cloud generation)
 *
 * Usage:
 *   node scripts/sync-faculty.mjs          # Sync data and download any missing images
 *   node scripts/sync-faculty.mjs --check  # Check if committed data drifts from department website (CI)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import https from "node:https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const FACULTY_URL = "https://im.mgt.ncu.edu.tw/teacher";
const SNAPSHOT_PATH = path.join(REPO_ROOT, "src", "data", "im-teachers.json");
const PHOTO_DIR = path.join(REPO_ROOT, "public", "teachers");

const CHECK_MODE = process.argv.includes("--check");

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).href;
          return fetchHtml(nextUrl).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to fetch ${url} (HTTP ${res.statusCode})`));
        }
        let body = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => resolve(body));
      }
    ).on("error", reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURI(url);
    https.get(encoded, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const file = createWriteStream(destPath);
      res.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", reject);
  });
}

function extractField(html, header) {
  const marker = `<th>${header}</th>`;
  const idx = html.indexOf(marker);
  if (idx === -1) return "";
  const sub = html.slice(idx);
  const tdStart = sub.indexOf('<td class="ba_comment">');
  if (tdStart === -1) return "";
  const contentStart = tdStart + '<td class="ba_comment">'.length;
  const tdEnd = sub.indexOf("</td>", contentStart);
  if (tdEnd === -1) return "";
  return sub.slice(contentStart, tdEnd).replace(/<[^>]+>/g, "").replace(/&nbsp;?/g, " ").trim();
}

export function parseFacultyHtml(html) {
  const teacherTableRegex = /<table class="table table-striped table-dark teacher-table"[\s\S]*?<\/table>/g;
  const tables = html.match(teacherTableRegex) || [];
  const teachers = [];

  for (const tableHtml of tables) {
    const anMatch = /<div class\s*=\s*"an"[^>]*>([\s\S]*?)<\/div>/i.exec(tableHtml);
    if (!anMatch) continue;

    const text = anMatch[1].replace(/<[^>]+>/g, "").replace(/&nbsp;?/g, " ").trim();
    const parts = text.split(/\s+/).filter(Boolean);
    const name = parts[0];
    const title = parts[1] || "教授";
    const role = parts.slice(2).join(" ");

    const imgMatch = /<img class="t_img"\s+src="([^"]+)"/i.exec(tableHtml);
    let photoUrl = imgMatch ? imgMatch[1].trim() : "";
    if (photoUrl && !photoUrl.startsWith("http")) {
      photoUrl = new URL(photoUrl, "https://im.mgt.ncu.edu.tw/").href;
    }

    const education = extractField(tableHtml, "學歷");
    const specialty = extractField(tableHtml, "專長");
    const office = extractField(tableHtml, "辦公室");

    const emailMatch = /mailto:([^"]+)"/i.exec(tableHtml);
    const email = emailMatch ? emailMatch[1].trim() : "";

    const specialtyTags = specialty
      ? specialty.split(/[,、，/\s]+/).map((s) => s.trim()).filter(Boolean)
      : [];

    const id = email ? email.split("@")[0].split(/[；;]/)[0].trim() : name;

    const parsedUrl = photoUrl ? new URL(photoUrl) : null;
    const rawExt = parsedUrl ? path.extname(parsedUrl.pathname) : "";
    const ext = rawExt && rawExt.length <= 5 ? rawExt : ".jpg";
    const localFileName = `${id}${ext}`;

    teachers.push({
      id,
      name,
      title,
      role: role || undefined,
      photoUrl,
      education,
      specialty,
      specialtyTags,
      office,
      email,
      localPhotoUrl: `/teachers/${localFileName}`,
    });
  }

  return teachers;
}

function verifyDrift(existingTeachers, liveTeachers) {
  const existingMap = new Map(existingTeachers.map((t) => [t.id, t]));
  const liveMap = new Map(liveTeachers.map((t) => [t.id, t]));

  const added = liveTeachers.filter((t) => !existingMap.has(t.id));
  const removed = existingTeachers.filter((t) => !liveMap.has(t.id));

  let hasDrift = false;
  if (added.length > 0) {
    console.warn(`[sync-faculty] DRIFT DETECTED: ${added.length} new teacher(s):`, added.map((t) => t.name).join(", "));
    hasDrift = true;
  }
  if (removed.length > 0) {
    console.warn(`[sync-faculty] DRIFT DETECTED: ${removed.length} removed/retired teacher(s):`, removed.map((t) => t.name).join(", "));
    hasDrift = true;
  }
  if (existingTeachers.length !== liveTeachers.length) {
    hasDrift = true;
  }
  return { hasDrift, added, removed };
}

async function syncPortraits(teachers) {
  if (!existsSync(PHOTO_DIR)) {
    mkdirSync(PHOTO_DIR, { recursive: true });
  }

  let downloadCount = 0;
  for (const t of teachers) {
    if (!t.photoUrl) continue;
    const localFileName = path.basename(t.localPhotoUrl);
    const dest = path.join(PHOTO_DIR, localFileName);

    if (!existsSync(dest)) {
      console.log(`[sync-faculty] Downloading portrait for ${t.name} -> ${localFileName}`);
      try {
        await downloadFile(t.photoUrl, dest);
        downloadCount++;
      } catch (err) {
        console.warn(`[sync-faculty] Failed to download photo for ${t.name}:`, err.message);
      }
    }
  }
  return downloadCount;
}

async function main() {
  console.log(`[sync-faculty] Fetching faculty list from ${FACULTY_URL}...`);
  const html = await fetchHtml(FACULTY_URL);
  const liveTeachers = parseFacultyHtml(html);

  console.log(`[sync-faculty] Parsed ${liveTeachers.length} teachers from live site.`);

  if (liveTeachers.length === 0) {
    console.error("[sync-faculty] ERROR: No faculty parsed from page. Selector may have changed.");
    process.exit(1);
  }

  let existingTeachers = [];
  if (existsSync(SNAPSHOT_PATH)) {
    existingTeachers = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf-8"));
  }

  const { hasDrift, added, removed } = verifyDrift(existingTeachers, liveTeachers);

  if (CHECK_MODE) {
    if (hasDrift) {
      console.error("[sync-faculty] FAIL: Committed im-teachers.json is out of date. Run 'npm run sync:faculty' to update.");
      process.exit(1);
    }
    console.log("[sync-faculty] PASS: Committed im-teachers.json is up to date with live faculty site.");
    return;
  }

  const downloadCount = await syncPortraits(liveTeachers);
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(liveTeachers, null, 2) + "\n", "utf-8");

  console.log(`[sync-faculty] Successfully synced ${liveTeachers.length} teachers.`);
  if (downloadCount > 0) {
    console.log(`[sync-faculty] Downloaded ${downloadCount} new portrait(s).`);
  }
  if (added.length > 0) {
    console.log(`[sync-faculty] Added: ${added.map((t) => t.name).join(", ")}`);
  }
  if (removed.length > 0) {
    console.log(`[sync-faculty] Removed/Retired: ${removed.map((t) => t.name).join(", ")}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}

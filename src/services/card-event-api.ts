/**
 * Card Event API Service
 *
 * Integrates with the NCUIM event card & leaderboard server (https://ncuim2026.thanatosjun.com).
 */

export const CARD_EVENT_CONFIG = {
  baseUrl: "https://ncuim2026.thanatosjun.com",
  defaultEventId: "cmtk8wdsh000001s64nx67aky",
  storageKey: "ncuim_card_entry_info",
} as const;

export interface LeaderboardEntry {
  readonly rank: number;
  readonly nickname: string;
  readonly score: number;
}

export interface LeaderboardResponse {
  readonly event: {
    readonly name: string;
  };
  readonly updatedAt: string;
  readonly totalRanked: number;
  readonly top: readonly LeaderboardEntry[];
}

export interface EntryCodeInfo {
  readonly entryCode: string;
  readonly role: string;
  readonly label: string;
  readonly event: {
    readonly id: string;
    readonly name: string;
  };
}

export interface SavedParticipantInfo {
  readonly entryCode: string;
  readonly eventId: string;
  readonly role: string;
  readonly label: string;
  readonly eventName: string;
  readonly savedAt: number;
}

/**
 * Fetch live leaderboard rankings from the card server.
 */
export async function fetchLiveLeaderboard(
  eventId: string = CARD_EVENT_CONFIG.defaultEventId,
): Promise<LeaderboardResponse> {
  const url = `${CARD_EVENT_CONFIG.baseUrl}/api/public/leaderboard?eventId=${encodeURIComponent(eventId)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`排行榜載入失敗 (HTTP ${res.status})`);
  }

  return (await res.json()) as LeaderboardResponse;
}

/**
 * Validate an entry code against the card server.
 */
export async function verifyEntryCode(code: string): Promise<EntryCodeInfo> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    throw new Error("請輸入報到碼");
  }

  const url = `${CARD_EVENT_CONFIG.baseUrl}/api/entry/${encodeURIComponent(trimmed)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error("伺服器跨域限制，請直接點擊「前往報到」");
  }

  let data: Record<string, unknown> | null = null;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response body
  }

  if (!res.ok) {
    const errorMsg =
      data && typeof data.error === "string" ? data.error : null;
    throw new Error(errorMsg ?? `驗證失敗 (HTTP ${res.status})`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("伺服器回應格式錯誤");
  }

  return data as unknown as EntryCodeInfo;
}

/**
 * Retrieve saved participant information, validating against current eventId.
 */
export function getSavedParticipantInfo(
  expectedEventId: string = CARD_EVENT_CONFIG.defaultEventId,
): SavedParticipantInfo | null {
  try {
    const raw = localStorage.getItem(CARD_EVENT_CONFIG.storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedParticipantInfo;
    if (parsed.eventId && parsed.eventId !== expectedEventId) {
      clearSavedParticipantInfo();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveParticipantInfo(info: EntryCodeInfo): void {
  try {
    const saved: SavedParticipantInfo = {
      entryCode: info.entryCode,
      eventId: info.event.id,
      role: info.role,
      label: info.label,
      eventName: info.event.name,
      savedAt: Date.now(),
    };
    localStorage.setItem(CARD_EVENT_CONFIG.storageKey, JSON.stringify(saved));
  } catch {
    // Ignore localStorage write error in private mode
  }
}

export function clearSavedParticipantInfo(): void {
  try {
    localStorage.removeItem(CARD_EVENT_CONFIG.storageKey);
  } catch {
    // Ignore
  }
}

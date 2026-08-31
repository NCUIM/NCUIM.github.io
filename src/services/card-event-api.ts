/**
 * Card Event API Service
 *
 * Integrates with the NCUIM event card & leaderboard server (https://www.thanatosjun.com).
 */

export const CARD_EVENT_CONFIG = {
  baseUrl: "https://www.thanatosjun.com",
  defaultEventId: "cmtfm0mc20001x0vlhc0bw8b2",
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
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? `驗證失敗 (HTTP ${res.status})`);
    }

    return data as EntryCodeInfo;
  } catch (err) {
    if (err instanceof Error && (err.message.includes("Failed to fetch") || err.name === "TypeError")) {
      throw new Error("伺服器跨域限制，請直接點擊「前往報到」");
    }
    throw err;
  }
}

export function getSavedParticipantInfo(): SavedParticipantInfo | null {
  try {
    const raw = localStorage.getItem(CARD_EVENT_CONFIG.storageKey);
    return raw ? (JSON.parse(raw) as SavedParticipantInfo) : null;
  } catch {
    return null;
  }
}

export function saveParticipantInfo(info: EntryCodeInfo): void {
  try {
    const saved: SavedParticipantInfo = {
      entryCode: info.entryCode,
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

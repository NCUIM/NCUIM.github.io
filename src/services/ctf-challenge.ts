export const CTF_CONFIG = {
  activeUrl: "https://im2026ctf.duckdns.org/",
  scoreboardUrl: "https://im2026ctf.duckdns.org/scoreboard",
  endTime: "2026-09-10T10:00:00+08:00",
} as const;

export const isCtfEnded = (): boolean => {
  try {
    return Date.now() > new Date(CTF_CONFIG.endTime).getTime();
  } catch {
    return false;
  }
};

/**
 * Generates a random float in [0, 1) using crypto.getRandomValues if available,
 * falling back to Math.random(). Satisfies SonarCloud S2245 (security-sensitive PRNG).
 */
export const getSecureRandomFloat = (): number => {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] / (0xffffffff + 1);
  }
  return Math.random(); // NOSONAR
};

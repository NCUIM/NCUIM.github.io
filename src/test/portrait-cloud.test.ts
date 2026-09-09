import { afterEach, describe, expect, it, vi } from "vitest";
import { createPortraitCloud, isFrontAligned } from "../components/faculty/portrait-cloud";
import * as random from "../utils/random";

afterEach(() => vi.restoreAllMocks());

describe("point-cloud alignment puzzle", () => {
  it("fills a sphere with colors sampled from its front projection, not six faces", () => {
    let seed = 12345;
    vi.spyOn(random, "getSecureRandomFloat").mockImplementation(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    });
    const pixels = new Uint8ClampedArray([255, 255, 255, 255, 10, 20, 30, 255, 0, 0, 0, 255, 40, 50, 60, 255]);
    const points = createPortraitCloud(pixels, 2, 2);
    expect(points).toHaveLength(6500);
    expect(points.every(p => Math.hypot(p.x, p.y, p.z) <= 105.000001)).toBe(true);
    for (const axis of ["x", "y", "z"] as const) {
      expect(Math.max(...points.map(p => p[axis]))).toBeGreaterThan(100);
      expect(Math.min(...points.map(p => p[axis]))).toBeLessThan(-100);
      expect(points.reduce((sum, p) => sum + p[axis] ** 2, 0) / points.length / 105 ** 2).toBeCloseTo(0.2, 1);
    }
    for (const p of points) {
      const color = p.y < 0 ? (p.x < 0 ? "rgb(255,255,255)" : "rgb(10,20,30)")
        : (p.x < 0 ? "rgb(0,0,0)" : "rgb(40,50,60)");
      expect(p.color).toBe(color);
    }
    expect(createPortraitCloud(new Uint8ClampedArray(16), 2, 2)).toEqual([]);
    expect(createPortraitCloud(new Uint8ClampedArray(), 0, 0)).toEqual([]);
  });
  it("accepts front and mirrored views after rotations, but rejects sides and tilted views", () => {
    expect(isFrontAligned(0, 0)).toBe(true);
    expect(isFrontAligned(0.09, Math.PI * 2 - 0.09)).toBe(true);
    expect(isFrontAligned(0, -Math.PI * 2)).toBe(true);
    for (const yaw of [Math.PI, -Math.PI, Math.PI * 3, -Math.PI * 3]) {
      expect(isFrontAligned(0, yaw)).toBe(true);
      expect(isFrontAligned(0.09, yaw - 0.09)).toBe(true);
      expect(isFrontAligned(-0.09, yaw + 0.09)).toBe(true);
      expect(isFrontAligned(0, yaw + 0.11)).toBe(false);
      expect(isFrontAligned(0.11, yaw)).toBe(false);
    }
    expect(isFrontAligned(0, Math.PI / 2)).toBe(false);
    expect(isFrontAligned(0.2, 0)).toBe(false);
    expect(isFrontAligned(0, 0.2)).toBe(false);
  });
});

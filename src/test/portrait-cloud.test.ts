import { describe, expect, it } from "vitest";
import { createPortraitCloud, isFrontAligned } from "../components/faculty/portrait-cloud";

describe("point-cloud alignment puzzle", () => {
  it("keeps source pixels at their front projection without adding side/back surfaces", () => {
    const pixels = new Uint8ClampedArray([255, 255, 255, 255, 10, 20, 30, 255, 0, 0, 0, 0, 40, 50, 60, 255]);
    const points = createPortraitCloud(pixels, 2, 2);
    expect(points).toHaveLength(3);
    expect(points.map(p => [p.x, p.y])).toEqual([[-105, -105], [105, -105], [105, 105]]);
    expect(points[0].color).toBe("rgb(255,255,255)");
    expect(points.every(p => p.z >= -90 && p.z <= 90)).toBe(true);
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

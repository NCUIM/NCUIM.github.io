import { getSecureRandomFloat } from "../../utils/random";

export interface PortraitPoint {
  x: number;
  y: number;
  z: number;
  color: string;
}

// An anamorphic puzzle: random depth scatters the image when rotated, while
// orthographic front projection exactly restores each source pixel position.
export function createPortraitCloud(data: Uint8ClampedArray, width: number, height: number): PortraitPoint[] {
  const points: PortraitPoint[] = [];
  const spacing = 210 / (height - 1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < 60) continue;
      points.push({
        x: (x - (width - 1) / 2) * spacing,
        y: (y - (height - 1) / 2) * spacing,
        z: (getSecureRandomFloat() - 0.5) * 180,
        color: `rgb(${data[index]},${data[index + 1]},${data[index + 2]})`,
      });
    }
  }
  return points;
}

export function isFrontAligned(pitch: number, yaw: number): boolean {
  const wrappedYaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
  // Both front and mirrored back views reconstruct a recognizable portrait.
  const alignmentError = Math.min(Math.abs(wrappedYaw), Math.PI - Math.abs(wrappedYaw));
  return Math.abs(pitch) <= 0.1 && alignmentError <= 0.1;
}

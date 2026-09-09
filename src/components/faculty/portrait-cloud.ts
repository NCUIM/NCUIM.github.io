import { getSecureRandomFloat } from "../../utils/random";

export interface PortraitPoint {
  x: number;
  y: number;
  z: number;
  color: string;
}

// Uniform volume, not a textured sphere: geometry has no flat faces or grid
// to give away the answer. Only the front projection reconstructs the colors.
export function createPortraitCloud(data: Uint8ClampedArray, width: number, height: number): PortraitPoint[] {
  const points: PortraitPoint[] = [];
  if (width < 1 || height < 1) return points;
  for (let i = 0; i < 6500; i++) {
    const radius = 105 * Math.cbrt(getSecureRandomFloat());
    const vertical = getSecureRandomFloat() * 2 - 1;
    const angle = getSecureRandomFloat() * Math.PI * 2;
    const ring = radius * Math.sqrt(1 - vertical * vertical);
    const x = ring * Math.cos(angle);
    const y = radius * vertical;
    const z = ring * Math.sin(angle);
    const pixelX = Math.min(width - 1, Math.floor((x / 210 + 0.5) * width));
    const pixelY = Math.min(height - 1, Math.floor((y / 210 + 0.5) * height));
    const index = (pixelY * width + pixelX) * 4;
    if (data[index + 3] < 60) continue;
    points.push({ x, y, z, color: `rgb(${data[index]},${data[index + 1]},${data[index + 2]})` });
  }
  return points;
}

export function isFrontAligned(pitch: number, yaw: number): boolean {
  const wrappedYaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
  // Both front and mirrored back views reconstruct a recognizable portrait.
  const alignmentError = Math.min(Math.abs(wrappedYaw), Math.PI - Math.abs(wrappedYaw));
  return Math.abs(pitch) <= 0.1 && alignmentError <= 0.1;
}

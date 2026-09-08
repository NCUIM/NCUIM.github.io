import { getSecureRandomFloat } from "./random";

/**
 * Lightweight 2D canvas particle confetti effect.
 * Returns a cancellation callback to abort animation when modal closes.
 */
export const triggerConfetti = (canvas: HTMLCanvasElement | null): (() => void) => {
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const count = 75;
  const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#fbbf24"];
  const pieces = Array.from({ length: count }, () => ({
    x: canvas.width / 2,
    y: canvas.height * 0.4,
    vx: (getSecureRandomFloat() - 0.5) * 16,
    vy: -getSecureRandomFloat() * 14 - 4,
    size: 6 + getSecureRandomFloat() * 6,
    color: colors[Math.floor(getSecureRandomFloat() * colors.length)],
    rotation: getSecureRandomFloat() * 360,
    rotSpeed: (getSecureRandomFloat() - 0.5) * 12,
    gravity: 0.35 + getSecureRandomFloat() * 0.2,
    alpha: 1,
  }));

  let frame = 0;
  let animId = 0;
  let cancelled = false;

  const animate = () => {
    if (cancelled) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;

    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;

      if (p.alpha > 0 && p.y < canvas.height) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }

    frame++;
    if (alive > 0 && frame < 120 && !cancelled) {
      animId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  animId = requestAnimationFrame(animate);

  return () => {
    cancelled = true;
    if (animId) {
      cancelAnimationFrame(animId);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
};

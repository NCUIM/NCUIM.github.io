/**
 * Lightweight 2D canvas particle confetti effect.
 */
export const triggerConfetti = (canvas: HTMLCanvasElement | null) => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const count = 75;
  const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#fbbf24"];
  const pieces = Array.from({ length: count }, () => ({
    x: canvas.width / 2,
    y: canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 14 - 4,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 12,
    gravity: 0.35 + Math.random() * 0.2,
    alpha: 1,
  }));

  let frame = 0;
  const animate = () => {
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
    if (alive > 0 && frame < 120) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  requestAnimationFrame(animate);
};

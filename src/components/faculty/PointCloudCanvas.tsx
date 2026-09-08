import React, { useEffect, useRef, useCallback } from "react";
import type { TeacherProfile } from "../../types/faculty";

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  alpha: number;
}

interface PointCloudCanvasProps {
  teacher: TeacherProfile;
  isCelebrating: boolean;
  onBurstComplete?: () => void;
}

export const PointCloudCanvas: React.FC<PointCloudCanvasProps> = ({
  teacher,
  isCelebrating,
  onBurstComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Rotation angles
  const rotYRef = useRef(0);
  const rotXRef = useRef(0.2);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const velocityRotRef = useRef({ x: 0, y: 0.006 });

  // Particles & phase
  const particlesRef = useRef<Point3D[]>([]);
  const phaseRef = useRef<"orbit" | "implode" | "burst" | "settle">("orbit");
  const phaseTimerRef = useRef(0);

  // Generate initial point cloud shape (Spherical Quantum Nebula)
  const initCloudParticles = useCallback((count = 900) => {
    const pts: Point3D[] = [];
    const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#f59e0b", "#fbbf24", "#818cf8", "#38bdf8"];

    for (let i = 0; i < count; i++) {
      // Golden spiral distribution on sphere + noise
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + 5 ** 0.5) * i;
      const radius = 90 + (Math.sin(i * 0.4) * 20) + (Math.random() - 0.5) * 35;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      pts.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        color: colors[i % colors.length],
        size: 1.8 + Math.random() * 2.2,
        alpha: 0.6 + Math.random() * 0.4,
      });
    }
    particlesRef.current = pts;
  }, []);

  // Initialize or reset when teacher changes
  useEffect(() => {
    initCloudParticles();
    phaseRef.current = "orbit";
    phaseTimerRef.current = 0;
  }, [teacher.id, initCloudParticles]);

  // Handle celebration trigger
  useEffect(() => {
    if (isCelebrating && phaseRef.current === "orbit") {
      phaseRef.current = "implode";
      phaseTimerRef.current = 0;
    }
  }, [isCelebrating]);

  // Touch and Mouse interaction handlers
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: clientX, y: clientY };
    velocityRotRef.current = { x: 0, y: 0 };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - lastMousePosRef.current.x;
    const dy = clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: clientX, y: clientY };

    rotYRef.current += dx * 0.008;
    rotXRef.current += dy * 0.008;
    velocityRotRef.current = { x: dy * 0.004, y: dx * 0.004 };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.03;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * window.devicePixelRatio || canvas.height !== height * window.devicePixelRatio) {
        canvas.width = width * (window.devicePixelRatio || 1);
        canvas.height = height * (window.devicePixelRatio || 1);
      }

      ctx.save();
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, width, height);

      // Camera auto-rotation with damping
      if (!isDraggingRef.current) {
        rotYRef.current += velocityRotRef.current.y;
        rotXRef.current += velocityRotRef.current.x;
        velocityRotRef.current.y = velocityRotRef.current.y * 0.96 + 0.006 * 0.04;
        velocityRotRef.current.x *= 0.95;
      }

      const cx = width / 2;
      const cy = height / 2;
      const fov = 350;

      // Trigonometry for 3D rotation matrix
      const cosY = Math.cos(rotYRef.current);
      const sinY = Math.sin(rotYRef.current);
      const cosX = Math.cos(rotXRef.current);
      const sinX = Math.sin(rotXRef.current);

      const particles = particlesRef.current;
      const phase = phaseRef.current;

      // Phase handling
      if (phase === "implode") {
        phaseTimerRef.current += 1;
        for (const p of particles) {
          p.x *= 0.88;
          p.y *= 0.88;
          p.z *= 0.88;
        }
        if (phaseTimerRef.current > 18) {
          phaseRef.current = "burst";
          phaseTimerRef.current = 0;
          for (const p of particles) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 6 + Math.random() * 12;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.vz = (Math.random() - 0.5) * speed;
            p.color = Math.random() > 0.3 ? "#fbbf24" : "#ffffff";
          }
          if (onBurstComplete) onBurstComplete();
        }
      } else if (phase === "burst") {
        phaseTimerRef.current += 1;
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.vz *= 0.92;
        }
        if (phaseTimerRef.current > 40) {
          phaseRef.current = "settle";
        }
      } else if (phase === "settle") {
        for (const p of particles) {
          p.x += (p.baseX * 1.2 - p.x) * 0.05;
          p.y += (p.baseY * 1.2 - p.y) * 0.05;
          p.z += (p.baseZ * 1.2 - p.z) * 0.05;
        }
      } else {
        // Orbit waving motion
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const wave = Math.sin(time + p.baseX * 0.04) * 3;
          p.x = p.baseX + wave;
          p.y = p.baseY + Math.cos(time + p.baseZ * 0.04) * 3;
          p.z = p.baseZ;
        }
      }

      // Project & depth sort
      interface ProjectedPoint {
        x2d: number;
        y2d: number;
        z: number;
        size: number;
        color: string;
        alpha: number;
      }

      const projected: ProjectedPoint[] = [];

      for (const p of particles) {
        // Rotate around Y-axis
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        // Rotate around X-axis
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective projection
        const scale = fov / (fov + z2 + 200);
        const x2d = cx + x1 * scale;
        const y2d = cy + y2 * scale;

        projected.push({
          x2d,
          y2d,
          z: z2,
          size: p.size * scale,
          color: p.color,
          alpha: Math.min(1, Math.max(0.15, p.alpha * (scale * 1.2))),
        });
      }

      projected.sort((a, b) => a.z - b.z);

      // Render dots
      for (const pt of projected) {
        ctx.beginPath();
        ctx.arc(pt.x2d, pt.y2d, Math.max(0.5, pt.size), 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.fill();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [onBurstComplete]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 260,
        background: "radial-gradient(circle at center, #1e293b 0%, #090d16 100%)",
        borderRadius: "var(--ncu-radius-lg, 16px)",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
        touchAction: "none",
        cursor: "grab",
      }}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => {
        if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 11,
          color: "rgba(255, 255, 255, 0.55)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        👆 左右滑動可旋轉 3D 雲點視角
      </div>
    </div>
  );
};

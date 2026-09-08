import React, { useEffect, useRef, useState, useCallback } from "react";
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

// Generate initial 3D bust point cloud placeholder
const createFallbackBust = (): Point3D[] => {
  const pts: Point3D[] = [];
  for (let i = 0; i < 1100; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / 1100);
    const theta = Math.PI * (1 + 5 ** 0.5) * i;
    const isHead = i < 750;

    const rx = isHead ? 45 : 75;
    const ry = isHead ? 55 : 45;
    const rz = isHead ? 50 : 35;
    const yOffset = isHead ? -20 : 50;

    const x = rx * Math.sin(phi) * Math.cos(theta);
    const y = ry * Math.cos(phi) + yOffset;
    const z = rz * Math.sin(phi) * Math.sin(theta);

    pts.push({
      x,
      y,
      z,
      baseX: x,
      baseY: y,
      baseZ: z,
      vx: 0,
      vy: 0,
      vz: 0,
      color: isHead ? "#60a5fa" : "#3b82f6",
      size: 1.8,
      alpha: 0.85,
    });
  }
  return pts;
};

export const PointCloudCanvas: React.FC<PointCloudCanvasProps> = ({
  teacher,
  isCelebrating,
  onBurstComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Rotation angles: start at a gentle 25-degree perspective angle
  const rotYRef = useRef(0.35);
  const rotXRef = useRef(0.06);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const velocityRotRef = useRef({ x: 0, y: 0.002 });

  // Initialize with 3D bust points so canvas is never empty
  const particlesRef = useRef<Point3D[]>(createFallbackBust());
  const phaseRef = useRef<"orbit" | "implode" | "burst" | "settle">("orbit");
  const phaseTimerRef = useRef(0);

  // Load teacher photo and extract true 3D volumetric bust point cloud
  const generatePointCloudFromImage = useCallback((imgSrc: string) => {
    setLoading(true);
    const img = new Image();
    if (imgSrc.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      try {
        const sampleW = 52;
        const sampleH = 65;
        const offscreen = document.createElement("canvas");
        offscreen.width = sampleW;
        offscreen.height = sampleH;
        const oCtx = offscreen.getContext("2d", { willReadFrequently: true });

        if (!oCtx) {
          setLoading(false);
          return;
        }

        oCtx.drawImage(img, 0, 0, sampleW, sampleH);
        const imgData = oCtx.getImageData(0, 0, sampleW, sampleH).data;

        // Sample corner pixels to detect background color
        const bgR = imgData[0];
        const bgG = imgData[1];
        const bgB = imgData[2];

        const pts: Point3D[] = [];

        for (let y = 0; y < sampleH; y++) {
          for (let x = 0; x < sampleW; x++) {
            const idx = (y * sampleW + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            const a = imgData[idx + 3];

            if (a < 60) continue;

            // Filter out flat photo background so only the person remains
            const distFromBg = Math.hypot(r - bgR, g - bgG, b - bgB);
            const isNearWhiteBg = r > 220 && g > 220 && b > 220 && (x < 6 || x > sampleW - 7 || y < 6);
            if (distFromBg < 28 || isNearWhiteBg) continue;

            // Normalized coordinates [-1, 1]
            const nx = (x / (sampleW - 1) - 0.5) * 2;
            const ny = (y / (sampleH - 1) - 0.5) * 2;

            // Luminance detail for nose / eye relief
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // True 3D head and torso volumetric depth:
            // Center of face protrudes outward, edges curve smoothly around
            const isHead = ny < 0.25;
            const curveZ = isHead
              ? Math.sqrt(Math.max(0, 1 - (nx / 0.88) ** 2)) * 62
              : Math.sqrt(Math.max(0, 1 - (nx / 0.95) ** 2)) * 40;

            const reliefZ = (lum / 255) * 14;
            const noiseZ = (Math.random() - 0.5) * 2.5;

            // Front surface particle
            const frontZ = curveZ + reliefZ - 32 + noiseZ;
            const px = nx * 82;
            const py = ny * 105;

            pts.push({
              x: px,
              y: py,
              z: frontZ,
              baseX: px,
              baseY: py,
              baseZ: frontZ,
              vx: 0,
              vy: 0,
              vz: 0,
              color: `rgb(${r},${g},${b})`,
              size: 1.8 + (1 - Math.abs(nx)) * 0.5,
              alpha: 0.96,
            });

            // For the head region, add back-of-head particles so the 3D model
            // has realistic head volume from side and back angles!
            if (isHead && Math.abs(nx) < 0.8 && (x + y) % 3 === 0) {
              const backZ = -curveZ * 0.7 - 8 + (Math.random() - 0.5) * 6;
              // Slightly darker tone for back of hair/shadow
              const darkR = Math.max(15, Math.floor(r * 0.5));
              const darkG = Math.max(15, Math.floor(g * 0.5));
              const darkB = Math.max(20, Math.floor(b * 0.5));

              pts.push({
                x: px * 0.95,
                y: py,
                z: backZ,
                baseX: px * 0.95,
                baseY: py,
                baseZ: backZ,
                vx: 0,
                vy: 0,
                vz: 0,
                color: `rgb(${darkR},${darkG},${darkB})`,
                size: 1.7,
                alpha: 0.85,
              });
            }
          }
        }

        if (pts.length > 250) {
          particlesRef.current = pts;
        }
      } catch (err) {
        console.warn("Could not sample point cloud from image:", err);
      } finally {
        setLoading(false);
      }
    };

    img.onerror = () => {
      setLoading(false);
    };

    img.src = imgSrc;
  }, []);

  // Reload point cloud whenever teacher changes
  useEffect(() => {
    rotYRef.current = 0.35;
    rotXRef.current = 0.06;
    phaseRef.current = "orbit";
    phaseTimerRef.current = 0;
    const targetSrc = teacher.localPhotoUrl || teacher.photoUrl;
    generatePointCloudFromImage(targetSrc);
  }, [teacher.id, teacher.localPhotoUrl, teacher.photoUrl, generatePointCloudFromImage]);

  // Handle celebration trigger
  useEffect(() => {
    if (isCelebrating && phaseRef.current === "orbit") {
      phaseRef.current = "implode";
      phaseTimerRef.current = 0;
    }
  }, [isCelebrating]);

  // Pointer drag to rotate 3D view
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

    rotYRef.current += dx * 0.009;
    rotXRef.current -= dy * 0.009;
    velocityRotRef.current = { x: -dy * 0.004, y: dx * 0.004 };
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
      time += 0.02;
      const width = canvas.clientWidth || 320;
      const height = canvas.clientHeight || 280;

      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Camera auto-rotation with gentle damping
      if (!isDraggingRef.current) {
        rotYRef.current += velocityRotRef.current.y;
        rotXRef.current += velocityRotRef.current.x;
        velocityRotRef.current.y *= 0.94;
        velocityRotRef.current.x *= 0.94;
      }

      // Constrain vertical rotation
      rotXRef.current = Math.max(-0.6, Math.min(0.6, rotXRef.current));

      const cx = width / 2;
      const cy = height / 2;
      const fov = 380;

      const cosY = Math.cos(rotYRef.current);
      const sinY = Math.sin(rotYRef.current);
      const cosX = Math.cos(rotXRef.current);
      const sinX = Math.sin(rotXRef.current);

      const particles = particlesRef.current;
      const phase = phaseRef.current;

      // Animation phase management
      if (phase === "implode") {
        phaseTimerRef.current += 1;
        for (const p of particles) {
          p.x *= 0.85;
          p.y *= 0.85;
          p.z *= 0.85;
        }
        if (phaseTimerRef.current > 16) {
          phaseRef.current = "burst";
          phaseTimerRef.current = 0;
          for (const p of particles) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 7 + Math.random() * 14;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.vz = (Math.random() - 0.5) * speed;
          }
          if (onBurstComplete) onBurstComplete();
        }
      } else if (phase === "burst") {
        phaseTimerRef.current += 1;
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;
          p.vx *= 0.91;
          p.vy *= 0.91;
          p.vz *= 0.91;
        }
        if (phaseTimerRef.current > 35) {
          phaseRef.current = "settle";
        }
      } else if (phase === "settle") {
        // Rotate smoothly towards perfect front angle on settle
        rotYRef.current += (0 - rotYRef.current) * 0.06;
        rotXRef.current += (0 - rotXRef.current) * 0.06;

        for (const p of particles) {
          p.x += (p.baseX - p.x) * 0.08;
          p.y += (p.baseY - p.y) * 0.08;
          p.z += (p.baseZ - p.z) * 0.08;
        }
      } else {
        // Subtle floating living breathing vibration in 3D
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const subtleWave = Math.sin(time + p.baseX * 0.05) * 0.8;
          p.x = p.baseX;
          p.y = p.baseY + subtleWave;
          p.z = p.baseZ;
        }
      }

      // 3D Matrix Projection & Depth Sorting
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
        // Rotate Y
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective Projection
        const scale = fov / (fov + z2 + 220);
        const x2d = cx + x1 * scale;
        const y2d = cy + y2 * scale;

        projected.push({
          x2d,
          y2d,
          z: z2,
          size: p.size * scale,
          color: p.color,
          alpha: Math.min(1, Math.max(0.2, p.alpha * (scale * 1.15))),
        });
      }

      // Depth sort so closer points draw over distant ones
      projected.sort((a, b) => a.z - b.z);

      // Render dots
      for (const pt of projected) {
        ctx.beginPath();
        ctx.arc(pt.x2d, pt.y2d, Math.max(0.7, pt.size), 0, Math.PI * 2);
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
        height: 290,
        background: "radial-gradient(circle at center, #1e293b 0%, #090d16 100%)",
        borderRadius: "var(--ncu-radius-lg, 16px)",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
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
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            fontSize: 11,
            color: "rgba(255, 255, 255, 0.7)",
            background: "rgba(0,0,0,0.5)",
            padding: "2px 8px",
            borderRadius: 12,
            pointerEvents: "none",
          }}
        >
          載入 3D 點雲模型中…
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 11,
          color: "rgba(255, 255, 255, 0.65)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        👆 手指拖曳可 360° 旋轉立體胸像！
      </div>
    </div>
  );
};

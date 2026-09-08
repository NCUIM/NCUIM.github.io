import React, { useEffect, useRef, useState, useCallback } from "react";
import type { TeacherProfile } from "../../types/faculty";
import { createPortraitCloud, isFrontAligned } from "./portrait-cloud";

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

export interface ImageTargetItem {
  readonly id: string;
  readonly photoUrl?: string;
  readonly localPhotoUrl?: string;
}

interface PointCloudCanvasProps {
  item?: ImageTargetItem;
  teacher?: TeacherProfile;
  isCelebrating: boolean;
  onBurstComplete?: () => void;
  onAligned: () => void;
}

export const PointCloudCanvas: React.FC<PointCloudCanvasProps> = ({
  item,
  teacher,
  isCelebrating,
  onBurstComplete,
  onAligned,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const readyRef = useRef(false);
  const solvedRef = useRef(false);
  const onAlignedRef = useRef(onAligned);
  useEffect(() => { onAlignedRef.current = onAligned; }, [onAligned]);

  // Begin away from the target view; the player must align both axes.
  const rotYRef = useRef(1.05);
  const rotXRef = useRef(0.3);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });


  // No placeholder portrait: only the current loaded photo can be solved.
  const particlesRef = useRef<Point3D[]>([]);
  const phaseRef = useRef<"orbit" | "implode" | "burst" | "settle">("orbit");
  const phaseTimerRef = useRef(0);

  // Scatter source pixels in depth while preserving their front projection.
  const generatePointCloudFromImage = useCallback((imgSrc: string) => {
    setLoading(true);
    setLoadError(false);
    readyRef.current = false;
    const img = new Image();
    let cancelled = false;
    if (imgSrc.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      if (cancelled) return;
      try {
        const sampleW = 52;
        const sampleH = 65;
        const offscreen = document.createElement("canvas");
        offscreen.width = sampleW;
        offscreen.height = sampleH;
        const oCtx = offscreen.getContext("2d", { willReadFrequently: true });

        if (!oCtx) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        oCtx.drawImage(img, 0, 0, sampleW, sampleH);
        const imgData = oCtx.getImageData(0, 0, sampleW, sampleH).data;

        const pts: Point3D[] = createPortraitCloud(imgData, sampleW, sampleH).map((point) => ({
          ...point,
          baseX: point.x,
          baseY: point.y,
          baseZ: point.z,
          vx: 0, vy: 0, vz: 0,
          size: 1.05,
          alpha: 1,
        }));

        if (pts.length > 250) {
          particlesRef.current = pts;
          readyRef.current = true;
        } else {
          setLoadError(true);
        }
      } catch (err) {
        console.warn("Could not sample point cloud from image:", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    img.onerror = () => {
      if (!cancelled) { setLoading(false); setLoadError(true); }
    };

    img.src = imgSrc;
    return () => { cancelled = true; };
  }, []);

  // Reload point cloud whenever target item changes
  const targetItem = item || teacher;
  const targetId = targetItem?.id;
  const targetSrc = targetItem?.localPhotoUrl || targetItem?.photoUrl || "";

  useEffect(() => {
    rotYRef.current = 1.05;
    rotXRef.current = 0.3;
    solvedRef.current = false;
    phaseRef.current = "orbit";
    phaseTimerRef.current = 0;
    isDraggingRef.current = false;
    particlesRef.current = [];
    if (!targetSrc) return;
    return generatePointCloudFromImage(targetSrc);
  }, [targetId, targetSrc, generatePointCloudFromImage]);

  // Handle celebration trigger
  useEffect(() => {
    if (isCelebrating && phaseRef.current === "orbit") {
      phaseRef.current = "implode";
      phaseTimerRef.current = 0;
    }
  }, [isCelebrating]);

  // Pointer drag to rotate 3D view
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!readyRef.current || solvedRef.current) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - lastMousePosRef.current.x;
    const dy = clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: clientX, y: clientY };

    rotYRef.current += dx * 0.009;
    rotXRef.current -= dy * 0.009;
    checkAlignment();
  };

  const checkAlignment = () => {
    if (!readyRef.current || solvedRef.current || !isFrontAligned(rotXRef.current, rotYRef.current)) return;
    solvedRef.current = true;
    isDraggingRef.current = false;
    rotXRef.current = 0;
    rotYRef.current = 0;
    onAlignedRef.current();
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

      // Constrain vertical rotation
      rotXRef.current = Math.max(-0.6, Math.min(0.6, rotXRef.current));

      const cx = width / 2;
      const cy = height / 2;

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
        const fit = Math.min(width / 260, height / 280) * 1.45;
        const scale = fit * 0.7;
        const x2d = cx + x1 * scale;
        const y2d = cy + y2 * scale;

        projected.push({
          x2d,
          y2d,
          z: z2,
          size: p.size * scale,
          color: p.color,
          alpha: p.alpha,
        });
      }

      // Depth sort so closer points draw over distant ones
      projected.sort((a, b) => b.z - a.z);

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
      role="group"
      aria-label="旋轉視角，對準正面解鎖"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!readyRef.current || solvedRef.current) return;
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault();
        if (e.key === "ArrowLeft") rotYRef.current -= 0.05;
        if (e.key === "ArrowRight") rotYRef.current += 0.05;
        if (e.key === "ArrowUp") rotXRef.current += 0.05;
        if (e.key === "ArrowDown") rotXRef.current -= 0.05;
        checkAlignment();
      }}
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
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointerDown(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
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
          載入教授人像中…
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
        {loadError ? "照片載入失敗，請關閉後重試" : isCelebrating ? "🎉 人像已成形，通關！" : "👆 拖曳旋轉，讓人像成形即可通關（鏡像也算，可用方向鍵）"}
      </div>
    </div>
  );
};

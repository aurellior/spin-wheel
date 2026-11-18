"use client";

import { useEffect, useRef } from "react";

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  drag: number;
  alpha: number;
}

interface ConfettiOverlayProps {
  triggerKey: number;
}

const CONFETTI_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

export function ConfettiOverlay({ triggerKey }: ConfettiOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (triggerKey === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: ConfettiParticle[] = Array.from({ length: 130 }, () => ({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 14 - 4,
      size: Math.random() * 8 + 5,
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.35 + Math.random() * 0.15,
      drag: 0.985,
      alpha: 1,
    }));

    if (animIdRef.current !== null) {
      cancelAnimationFrame(animIdRef.current);
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeCount = 0;

      for (const p of particles) {
        p.vx *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height * 0.85) {
          p.alpha -= 0.025;
        }

        if (p.alpha > 0 && p.y < canvas.height + 30) {
          activeCount++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.55);
          ctx.restore();
        }
      }

      if (activeCount > 0) {
        animIdRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animIdRef.current = null;
      }
    };

    animIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, [triggerKey]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}

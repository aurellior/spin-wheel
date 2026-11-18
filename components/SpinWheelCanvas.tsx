"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  getSegmentColor,
  type SpinHistoryItem,
  type WheelOption,
} from "@/lib/spin-wheel";

interface SpinWheelCanvasProps {
  options: WheelOption[];
  currentAngle: number;
  pointerAngle: number;
  isSpinning: boolean;
  onSpin: () => void;
  spinHistory: SpinHistoryItem[];
  onClearHistory: () => void;
}

export function SpinWheelCanvas({
  options,
  currentAngle,
  pointerAngle,
  isSpinning,
  onSpin,
  spinHistory,
  onClearHistory,
}: SpinWheelCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = canvas.width / dpr;
    if (size <= 0) return;

    const center = size / 2;
    const outerRadius = center - 6;
    const wheelRadius = outerRadius - 12;

    ctx.clearRect(0, 0, size, size);

    const count = options.length;

    // 1. Bingkai Luar (Outer Rim)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#1E293B";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#CBD5E1";
    ctx.stroke();
    ctx.restore();

    if (count === 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, wheelRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#F1F5F9";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#CBD5E1";
      ctx.stroke();
      ctx.restore();
      return;
    }

    const sliceAngle = (Math.PI * 2) / count;

    // 2. Segmen Roda
    for (let i = 0; i < count; i++) {
      const startAngle = currentAngle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const fillColor = getSegmentColor(i, count);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, wheelRadius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.lineWidth = count > 24 ? 1 : 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.stroke();

      // 3. Teks Opsi di Dalam Segmen
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);

      const maxFontSize = Math.max(12, Math.floor(wheelRadius * 0.088));
      const arcThickness = wheelRadius * sliceAngle * 0.52;
      const dynamicFontSize = Math.max(
        9.5,
        Math.min(maxFontSize, Math.floor(arcThickness))
      );

      ctx.font = `700 ${dynamicFontSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      ctx.shadowColor = "rgba(15, 23, 42, 0.35)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      const label = options[i].text.trim() || `Opsi ${i + 1}`;
      const innerHubMargin = Math.max(48, wheelRadius * 0.28);
      const outerRimMargin = 18;
      const maxTextWidth = Math.max(
        40,
        wheelRadius - innerHubMargin - outerRimMargin
      );

      let displayLabel = label;
      if (ctx.measureText(displayLabel).width > maxTextWidth) {
        while (
          displayLabel.length > 1 &&
          ctx.measureText(displayLabel + "…").width > maxTextWidth
        ) {
          displayLabel = displayLabel.slice(0, -1);
        }
        displayLabel += "…";
      }

      ctx.fillText(displayLabel, wheelRadius - outerRimMargin, 0);
      ctx.restore();
      ctx.restore();
    }

    // 4. Pasak / Pin Kecil di Pinggiran Setiap Batas Segmen
    for (let i = 0; i < count; i++) {
      const pegAngle = currentAngle + i * sliceAngle;
      const pegDist = outerRadius - 6;
      const px = center + Math.cos(pegAngle) * pegDist;
      const py = center + Math.sin(pegAngle) * pegDist;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, count > 30 ? 2 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "#F8FAFC";
      ctx.fill();
      ctx.restore();
    }
  }, [options, currentAngle]);

  const resizeCanvas = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const size = Math.max(240, Math.floor(rect.width));
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  return (
    <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-70 pointer-events-none" />

      {/* Kontainer Roda Responsif */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[440px] aspect-square flex items-center justify-center my-2 select-none"
      >
        {/* Jarum Penunjuk (Pointer) di Bagian Atas Roda */}
        <div
          style={{
            transform: `translateX(-50%) rotate(${pointerAngle.toFixed(2)}deg)`,
            transformOrigin: "50% 18%",
          }}
          className="absolute -top-3 sm:-top-4 left-1/2 z-20 pointer-events-none drop-shadow-[0_6px_8px_rgba(15,23,42,0.28)] transition-none"
        >
          <svg
            className="w-10 h-12 sm:w-12 sm:h-14"
            viewBox="0 0 48 56"
            fill="none"
          >
            <path
              d="M24 54L6 18C6 8.05887 14.0589 0 24 0C33.9411 0 42 8.05887 42 18L24 54Z"
              fill="#1E293B"
            />
            <path
              d="M24 49L9.5 18.5C9.5 10.4919 15.9919 4 24 4C32.0081 4 38.5 10.4919 38.5 18.5L24 49Z"
              fill="url(#pointerGrad)"
            />
            <circle cx="24" cy="17" r="6" fill="#F8FAFC" />
            <circle cx="24" cy="17" r="3" fill="#334155" />
            <defs>
              <linearGradient
                id="pointerGrad"
                x1="24"
                y1="4"
                x2="24"
                y2="49"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F43F5E" />
                <stop offset="1" stopColor="#BE123C" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Canvas Utama Roda */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block rounded-full drop-shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
        />

        {/* Tombol Tengah Roda (Hub) */}
        <button
          type="button"
          onClick={onSpin}
          disabled={isSpinning}
          aria-label="Putar Roda"
          className="absolute z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 text-white font-extrabold text-sm sm:text-base tracking-wider shadow-[0_8px_20px_rgba(15,23,42,0.45)] border-4 border-white flex flex-col items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
        >
          <span>PUTAR</span>
        </button>
      </div>

      {/* Tombol Utama Putar di Bawah Roda */}
      <div className="mt-6 w-full max-w-sm flex flex-col items-center gap-2 relative z-10">
        <button
          type="button"
          onClick={onSpin}
          disabled={isSpinning}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-indigo-200/80 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg
            className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          <span>
            {isSpinning ? "SEDANG BERPUTAR..." : "PUTAR RODA SEKARANG"}
          </span>
        </button>
        <p className="text-xs text-slate-400 text-center">
          Tips: Klik tombol{" "}
          <span className="font-semibold text-slate-500">PUTAR</span> di tengah
          roda atau tekan{" "}
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono text-slate-600">
            Spasi
          </kbd>
        </p>
      </div>

      {/* Riwayat Putaran Terakhir */}
      {spinHistory.length > 0 && (
        <div className="mt-5 w-full max-w-md relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Riwayat Terakhir
            </span>
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs font-medium text-slate-400 hover:text-rose-600 transition cursor-pointer"
            >
              Bersihkan
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {spinHistory.map((item, idx) => (
              <span
                key={`${item.text}-${idx}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80 max-w-[180px]"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.text}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import type { WinnerInfo } from "@/lib/spin-wheel";

interface WinnerModalProps {
  winner: WinnerInfo | null;
  onSpinAgain: () => void;
  onRemoveOption: (id: string) => void;
  onClose: () => void;
}

export function WinnerModal({
  winner,
  onSpinAgain,
  onRemoveOption,
  onClose,
}: WinnerModalProps) {
  const spinAgainBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => {
        spinAgainBtnRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [winner]);

  if (!winner) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="winnerModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-pop-bounce">
        <div
          className="h-3 w-full"
          style={{ backgroundColor: winner.color }}
        />

        <div className="p-6 sm:p-8 text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: winner.color }}
          >
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>

          <p
            id="winnerModalTitle"
            className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
          >
            Opsi Terpilih!
          </p>

          <div
            className="my-3 px-4 py-5 rounded-2xl bg-slate-50 border-2"
            style={{ borderColor: winner.color }}
          >
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 break-words leading-tight">
              {winner.text}
            </h3>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              ref={spinAgainBtnRef}
              type="button"
              onClick={onSpinAgain}
              className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-md shadow-indigo-200 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Putar Lagi
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onRemoveOption(winner.id)}
                className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs sm:text-sm transition active:scale-[0.98] cursor-pointer"
              >
                Hapus Opsi Ini
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs sm:text-sm transition active:scale-[0.98] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

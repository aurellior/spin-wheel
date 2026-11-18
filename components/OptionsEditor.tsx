"use client";

import { useRef, useState } from "react";
import { getSegmentColor, type WheelOption } from "@/lib/spin-wheel";

interface OptionsEditorProps {
  options: WheelOption[];
  isSpinning: boolean;
  onAddOption: (text: string) => void;
  onUpdateOption: (id: string, text: string) => void;
  onRemoveOption: (id: string) => void;
  onShuffle: () => void;
  onReset: () => void;
}

export function OptionsEditor({
  options,
  isSpinning,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onShuffle,
  onReset,
}: OptionsEditorProps) {
  const [newOptionText, setNewOptionText] = useState("");

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const newInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddSubmit = () => {
    if (isSpinning) return;
    onAddOption(newOptionText);
    setNewOptionText("");
    newInputRef.current?.focus();
    requestAnimationFrame(() => {
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop =
          listContainerRef.current.scrollHeight;
      }
    });
  };

  return (
    <aside className="lg:col-span-5 flex flex-col gap-5">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Daftar Opsi Roda
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onShuffle}
              disabled={isSpinning}
              title="Acak urutan opsi"
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition flex items-center gap-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              Acak Urutan
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={isSpinning}
              title="Kosongkan daftar opsi"
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition flex items-center gap-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset Default
            </button>
          </div>
        </div>

        <div>
          <div
            ref={listContainerRef}
            className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar"
          >
            {options.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-xs sm:text-sm text-slate-400">
                Daftar opsi masih kosong. Tambahkan minimal 2 opsi di bawah
                untuk memutar roda.
              </div>
            ) : (
              options.map((opt, index) => {
                const color = getSegmentColor(index, options.length);
                return (
                  <div key={opt.id} className="flex items-center gap-2 group">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-inner border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <input
                      type="text"
                      maxLength={45}
                      value={opt.text}
                      disabled={isSpinning}
                      placeholder={`Opsi ${index + 1}`}
                      onChange={(e) => onUpdateOption(opt.id, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={isSpinning}
                      onClick={() => onRemoveOption(opt.id)}
                      title="Hapus opsi ini"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <input
              ref={newInputRef}
              type="text"
              maxLength={45}
              value={newOptionText}
              disabled={isSpinning}
              onChange={(e) => setNewOptionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubmit();
                }
              }}
              placeholder="Ketik opsi baru lalu Enter..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition disabled:opacity-60"
            />
            <button
              type="button"
              disabled={isSpinning}
              onClick={handleAddSubmit}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition active:scale-95 shrink-0 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>+ Tambah Opsi</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

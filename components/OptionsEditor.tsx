"use client";

import { useRef, useState } from "react";
import {
  DEFAULT_OPTIONS,
  getSegmentColor,
  type WheelOption,
} from "@/lib/spin-wheel";

interface OptionsEditorProps {
  options: WheelOption[];
  isSpinning: boolean;
  onAddOption: (text: string) => void;
  onUpdateOption: (id: string, text: string) => void;
  onRemoveOption: (id: string) => void;
  onBulkUpdate: (lines: string[]) => void;
  onClearBulk: () => void;
  onShuffle: () => void;
  onReset: () => void;
}

export function OptionsEditor({
  options,
  isSpinning,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onBulkUpdate,
  onClearBulk,
  onShuffle,
  onReset,
}: OptionsEditorProps) {
  const [activeTab, setActiveTab] = useState<"list" | "bulk">("list");
  const [newOptionText, setNewOptionText] = useState("");
  const [bulkText, setBulkText] = useState(() =>
    options.map((o) => o.text).join("\n")
  );
  const [bulkWarning, setBulkWarning] = useState<string | null>(null);

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

  const handleBulkChange = (value: string) => {
    setBulkText(value);
    if (isSpinning) return;

    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    setBulkWarning(
      lines.length === 1 ? "Tambahkan minimal 2 baris opsi untuk memutar roda" : null
    );
    onBulkUpdate(lines);
  };

  const handleClearBulk = () => {
    if (isSpinning) return;
    onClearBulk();
    setBulkText("");
    setBulkWarning(null);
  };

  const detectedBulkCount = bulkText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;

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
              onClick={() => {
                onReset();
                setBulkText(DEFAULT_OPTIONS.join("\n"));
                setBulkWarning(null);
              }}
              disabled={isSpinning}
              title="Kembalikan ke opsi bawaan"
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

        {/* Navigasi Tab */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === "list"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Daftar Opsi
          </button>
          <button
            type="button"
            onClick={() => {
              setBulkText(options.map((o) => o.text).join("\n"));
              setBulkWarning(null);
              setActiveTab("bulk");
            }}
            className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === "bulk"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Edit Cepat (Per Baris)
          </button>
        </div>

        {/* MODE 1: Daftar Opsi Individual */}
        {activeTab === "list" ? (
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
        ) : (
          /* MODE 2: Edit Cepat (Textarea Per Baris) */
          <div>
            <label
              htmlFor="bulkTextarea"
              className="block text-xs text-slate-500 mb-2"
            >
              Masukkan satu opsi per baris (minimal 2 opsi). Perubahan otomatis
              tersinkronisasi dengan roda:
            </label>
            <textarea
              id="bulkTextarea"
              rows={11}
              value={bulkText}
              disabled={isSpinning}
              onChange={(e) => handleBulkChange(e.target.value)}
              placeholder={
                "Contoh:\nHadiah Utama\nVoucher Belanja\nKopi Gratis\nCoba Lagi"
              }
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 custom-scrollbar resize-y disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span
                className={
                  bulkWarning ? "text-amber-600 font-semibold" : undefined
                }
              >
                {bulkWarning ?? `${detectedBulkCount} opsi terdeteksi`}
              </span>
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleClearBulk}
                className="text-rose-600 hover:underline font-medium disabled:opacity-50 cursor-pointer"
              >
                Kosongkan Daftar
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

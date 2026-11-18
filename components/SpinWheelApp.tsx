"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ConfettiOverlay } from "@/components/ConfettiOverlay";
import { OptionsEditor } from "@/components/OptionsEditor";
import { SpinWheelCanvas } from "@/components/SpinWheelCanvas";
import { WinnerModal } from "@/components/WinnerModal";
import {
  DEFAULT_OPTIONS,
  generateOptionId,
  getSegmentColor,
  getSegmentIndexAtPointer,
  soundEffects,
  STORAGE_KEY_MUTED,
  type SpinHistoryItem,
  type ToastMessage,
  type WheelOption,
  type WinnerInfo,
} from "@/lib/spin-wheel";

function createDefaultOptions(): WheelOption[] {
  return DEFAULT_OPTIONS.map((text, idx) => ({
    id: `default_${idx}`,
    text,
  }));
}

function loadInitialMuted(): boolean {
  try {
    return Boolean(
      JSON.parse(localStorage.getItem(STORAGE_KEY_MUTED) || "false")
    );
  } catch {
    return false;
  }
}

const emptySubscribe = () => () => {};

export function SpinWheelApp() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        Memuat Roda Undian...
      </div>
    );
  }

  return <SpinWheelClient />;
}

function SpinWheelClient() {
  const [options, setOptions] = useState<WheelOption[]>(createDefaultOptions);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [pointerAngle, setPointerAngle] = useState(0);
  const [isMuted, setIsMuted] = useState<boolean>(loadInitialMuted);
  const [winner, setWinner] = useState<WinnerInfo | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinHistoryItem[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const currentAngleRef = useRef(0);
  const isSpinningRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  const animFrameRef = useRef<number | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, JSON.stringify(isMuted));
    } catch {
      // Abaikan error penyimpanan
    }
  }, [isMuted]);

  // Sinkronisasi Real-Time (SSE) dari server untuk POV User (tanpa info target admin)
  useEffect(() => {
    const eventSource = new EventSource("/api/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          options?: WheelOption[];
          spinHistory?: SpinHistoryItem[];
        };
        if (Array.isArray(data.options) && !isSpinningRef.current) {
          setOptions(data.options);
        }
        if (Array.isArray(data.spinHistory)) {
          setSpinHistory(data.spinHistory);
        }
      } catch {
        // Abaikan event yang tidak valid
      }
    };

    return () => {
      eventSource.close();
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastMessage["type"] = "info") => {
      const id = generateOptionId();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2800);
    },
    []
  );

  const pushOptionsToServer = useCallback(
    (nextOptions: WheelOption[], debounceMs = 0) => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      const send = async () => {
        try {
          await fetch("/api/wheel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ options: nextOptions }),
          });
        } catch {
          // Abaikan error jaringan sementara
        }
      };

      if (debounceMs > 0) {
        syncTimerRef.current = setTimeout(send, debounceMs);
      } else {
        void send();
      }
    },
    []
  );

  const spinWheel = useCallback(async () => {
    if (isSpinningRef.current) return;

    if (options.length < 2) {
      showToast("Tambahkan minimal 2 opsi untuk memutar roda!", "warning");
      return;
    }

    setWinner(null);
    soundEffects.ensureContext();

    isSpinningRef.current = true;
    setIsSpinning(true);

    // Ambil hasil target dari server saat tombol Spin ditekan
    let targetIndex = Math.floor(Math.random() * options.length);
    let offsetFraction = 0.2 + Math.random() * 0.6;

    try {
      const res = await fetch("/api/wheel/spin", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as {
          targetIndex?: number;
          offsetFraction?: number;
        };
        if (
          typeof data.targetIndex === "number" &&
          data.targetIndex >= 0 &&
          data.targetIndex < options.length
        ) {
          targetIndex = data.targetIndex;
        }
        if (typeof data.offsetFraction === "number") {
          offsetFraction = data.offsetFraction;
        }
      }
    } catch {
      // Fallback ke acak lokal jika koneksi gagal
    }

    const count = options.length;
    const TWO_PI = Math.PI * 2;
    const POINTER_ANGLE = (3 * Math.PI) / 2;
    const sliceAngle = TWO_PI / count;

    const startAngle = currentAngleRef.current;
    const currentRemainder = ((startAngle % TWO_PI) + TWO_PI) % TWO_PI;

    const extraSpins = 6 + Math.floor(Math.random() * 3);
    const targetLocalAngle = (targetIndex + offsetFraction) * sliceAngle;
    const desiredRemainder =
      (((POINTER_ANGLE - targetLocalAngle) % TWO_PI) + TWO_PI) % TWO_PI;
    const forwardDelta =
      (((desiredRemainder - currentRemainder) % TWO_PI) + TWO_PI) % TWO_PI;

    const deltaRotation = extraSpins * TWO_PI + forwardDelta;
    const finalAngle = startAngle + deltaRotation;
    const duration = 4600;
    const startTime = performance.now();

    let lastTickIndex = getSegmentIndexAtPointer(startAngle, count);
    let prevFrameAngle = startAngle;
    let localPointerAngle = 0;

    const easeOutQuartic = (t: number) => 1 - Math.pow(1 - t, 4.2);

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuartic(progress);

      const nextAngle = startAngle + deltaRotation * eased;
      const angularVelocity = Math.abs(nextAngle - prevFrameAngle);
      prevFrameAngle = nextAngle;
      currentAngleRef.current = nextAngle;

      const currentSegIndex = getSegmentIndexAtPointer(nextAngle, count);
      if (currentSegIndex !== lastTickIndex) {
        lastTickIndex = currentSegIndex;
        localPointerAngle = -Math.min(
          28,
          Math.max(14, angularVelocity * 140)
        );
        soundEffects.playTick(isMutedRef.current, angularVelocity * 12);
      }

      localPointerAngle *= 0.82;
      if (Math.abs(localPointerAngle) < 0.2) localPointerAngle = 0;

      setCurrentAngle(nextAngle);
      setPointerAngle(localPointerAngle);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateSpin);
      } else {
        currentAngleRef.current = finalAngle;
        setCurrentAngle(finalAngle);
        setPointerAngle(0);
        isSpinningRef.current = false;
        setIsSpinning(false);
        animFrameRef.current = null;

        const winningIndex = getSegmentIndexAtPointer(finalAngle, count);
        const winningOption = options[winningIndex];
        const winningColor = getSegmentColor(winningIndex, count);

        if (winningOption) {
          const text = winningOption.text.trim() || "Opsi Terpilih";
          setWinner({
            id: winningOption.id,
            text,
            color: winningColor,
          });
          soundEffects.playWin(isMutedRef.current);
          setConfettiKey((k) => k + 1);

          // Beritahu server bahwa spin selesai -> catat riwayat & reset forcedWinner ke null
          void fetch("/api/wheel/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, color: winningColor }),
          });
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animateSpin);
  }, [options, showToast]);

  // Pintasan Keyboard: Spasi untuk putar, Escape untuk tutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        void spinWheel();
      } else if (e.code === "Escape" && winner) {
        setWinner(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [spinWheel, winner]);

  const handleAddOption = (text: string) => {
    if (isSpinning) return;
    const cleaned = text.trim();
    const next = [
      ...options,
      {
        id: generateOptionId(),
        text: cleaned || `Opsi ${options.length + 1}`,
      },
    ];
    setOptions(next);
    pushOptionsToServer(next);
  };

  const handleUpdateOption = (id: string, text: string) => {
    if (isSpinning) return;
    const next = options.map((opt) =>
      opt.id === id ? { ...opt, text } : opt
    );
    setOptions(next);
    pushOptionsToServer(next, 200);
  };

  const handleRemoveOption = (id: string) => {
    if (isSpinning) return false;

    const next = options.filter((opt) => opt.id !== id);
    setOptions(next);
    pushOptionsToServer(next);
    return true;
  };

  const handleBulkUpdate = (lines: string[]) => {
    if (isSpinning) return;
    const next = lines.map((line, idx) => ({
      id: options[idx] ? options[idx].id : generateOptionId(),
      text: line,
    }));
    setOptions(next);
    pushOptionsToServer(next, 250);
  };

  const handleClearBulk = () => {
    if (isSpinning) return;
    const next: WheelOption[] = [];
    setOptions(next);
    pushOptionsToServer(next);
    showToast("Daftar opsi dikosongkan.", "info");
  };

  const handleShuffle = () => {
    if (isSpinning) return;
    const next = [...options];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOptions(next);
    pushOptionsToServer(next);
    showToast("Urutan opsi berhasil diacak!", "info");
  };

  const handleReset = () => {
    if (isSpinning) return;
    const next = DEFAULT_OPTIONS.map((text, idx) => ({
      id: `default_${idx}_${Date.now()}`,
      text,
    }));
    setOptions(next);
    currentAngleRef.current = 0;
    setCurrentAngle(0);
    pushOptionsToServer(next);
    showToast("Opsi dikembalikan ke pengaturan awal.", "info");
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.ensureContext();
      soundEffects.playTick(false, 1);
    }
  };

  return (
    <>
      <ConfettiOverlay triggerKey={confettiKey} />

      {/* Header Navigasi */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="2.5" />
                <path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21M5.64 5.64l4.6 4.6M13.76 13.76l4.6 4.6M18.36 5.64l-4.6 4.6M10.24 13.76l-4.6 4.6" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                Roda Undian
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Putar roda keberuntungan &amp; tentukan pilihan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {options.length} Opsi Aktif
            </span>

            <button
              type="button"
              onClick={toggleSound}
              title="Aktifkan/Matikan Efek Suara"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition active:scale-95 flex items-center gap-1.5 text-xs font-medium shadow-sm cursor-pointer"
            >
              {isMuted ? (
                <svg
                  className="w-4 h-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
              <span className="hidden sm:inline">
                {isMuted ? "Suara Mati" : "Suara Aktif"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Konten Utama: Layout 2 Kolom */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <SpinWheelCanvas
            options={options}
            currentAngle={currentAngle}
            pointerAngle={pointerAngle}
            isSpinning={isSpinning}
            onSpin={() => void spinWheel()}
            spinHistory={spinHistory}
            onClearHistory={() => {
              setSpinHistory([]);
              void fetch("/api/wheel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "clearHistory" }),
              });
              showToast("Riwayat putaran dibersihkan.", "info");
            }}
          />

          <OptionsEditor
            options={options}
            isSpinning={isSpinning}
            onAddOption={handleAddOption}
            onUpdateOption={handleUpdateOption}
            onRemoveOption={handleRemoveOption}
            onBulkUpdate={handleBulkUpdate}
            onClearBulk={handleClearBulk}
            onShuffle={handleShuffle}
            onReset={handleReset}
          />
        </div>
      </main>

      <WinnerModal
        winner={winner}
        onSpinAgain={() => {
          setWinner(null);
          void spinWheel();
        }}
        onRemoveOption={(id) => {
          const removed = handleRemoveOption(id);
          if (removed && winner) {
            showToast(`"${winner.text}" telah dihapus dari roda.`, "success");
            setWinner(null);
          }
        }}
        onClose={() => setWinner(null)}
      />

      {/* Toast Notifikasi */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const colors = {
            info: "bg-slate-800 text-white border-slate-700",
            warning: "bg-amber-600 text-white border-amber-500",
            success: "bg-emerald-600 text-white border-emerald-500",
          };
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto px-4 py-3 rounded-2xl shadow-lg border text-xs sm:text-sm font-medium flex items-center gap-2 transition-all duration-300 ${colors[toast.type]}`}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </>
  );
}

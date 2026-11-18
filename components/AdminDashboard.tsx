"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WheelServerState } from "@/lib/server-store";
import { getSegmentColor } from "@/lib/spin-wheel";

interface AdminDashboardProps {
  initialState: WheelServerState;
  adminUsername: string;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function AdminDashboard({
  initialState,
  adminUsername,
}: AdminDashboardProps) {
  const router = useRouter();
  const [state, setState] = useState<WheelServerState>(initialState);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("connecting");
  const [updatingTarget, setUpdatingTarget] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("/api/admin/stream");

    eventSource.onopen = () => {
      setConnStatus("connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const nextState = JSON.parse(event.data) as WheelServerState;
        setState(nextState);
        setConnStatus("connected");
      } catch {
        // Abaikan pesan yang tidak valid
      }
    };

    eventSource.onerror = () => {
      setConnStatus("disconnected");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleSelectTarget = async (targetId: string | null) => {
    setUpdatingTarget(true);
    try {
      const res = await fetch("/api/admin/target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (res.ok) {
        const nextState = (await res.json()) as WheelServerState;
        setState(nextState);
      }
    } finally {
      setUpdatingTarget(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const selectedOption = state.forcedWinnerId
    ? state.options.find((o) => o.id === state.forcedWinnerId) ?? null
    : null;

  const connBadge = {
    connected: {
      dot: "bg-emerald-500 animate-pulse",
      text: "Terhubung Real-time",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    connecting: {
      dot: "bg-amber-500 animate-pulse",
      text: "Menghubungkan...",
      bg: "bg-amber-50 text-amber-700 border-amber-200",
    },
    disconnected: {
      dot: "bg-rose-500",
      text: "Koneksi Terputus (Mencoba Ulang)",
      bg: "bg-rose-50 text-rose-700 border-rose-200",
    },
  }[connStatus];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Admin */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                Admin Control Panel
              </h1>
              <p className="text-xs text-slate-500 truncate">
                Login sebagai <span className="font-semibold">{adminUsername}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition hidden sm:inline-flex items-center gap-1.5"
            >
              Buka POV User
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 transition cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Status Indicator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Koneksi */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status Sinkronisasi
              </p>
              <div
                className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${connBadge.bg}`}
              >
                <span className={`w-2 h-2 rounded-full ${connBadge.dot}`} />
                {connBadge.text}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Total Opsi Aktif</p>
              <p className="text-2xl font-black text-slate-900">
                {state.options.length}
              </p>
            </div>
          </div>

          {/* Status Target Putaran Berikutnya */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3 transition ${
              selectedOption
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-white text-slate-900 border-slate-200/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    selectedOption ? "text-indigo-200" : "text-slate-400"
                  }`}
                >
                  Mode Putaran Berikutnya
                </p>
                <p className="mt-1 text-base sm:text-lg font-extrabold truncate">
                  {selectedOption
                    ? `Target Terkunci: ${selectedOption.text.trim() || "Opsi"}`
                    : "Mode Acak (Normal)"}
                </p>
              </div>
              {selectedOption && (
                <button
                  type="button"
                  disabled={updatingTarget}
                  onClick={() => void handleSelectTarget(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                >
                  Reset ke Acak
                </button>
              )}
            </div>
            <p
              className={`text-xs ${
                selectedOption ? "text-indigo-100" : "text-slate-500"
              }`}
            >
              {selectedOption
                ? "Roda akan berhenti tepat pada segmen ini pada putaran berikutnya, lalu otomatis kembali ke mode acak."
                : "Klik salah satu item di bawah untuk menentukan pemenang putaran berikutnya."}
            </p>
          </div>
        </div>

        {/* Live List Monitor & Target Winner Selector */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Live List Monitor &amp; Target Pemenang
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar ini tersinkronisasi langsung dengan input dari POV User
                tanpa perlu refresh.
              </p>
            </div>

            <button
              type="button"
              disabled={!selectedOption || updatingTarget}
              onClick={() => void handleSelectTarget(null)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Kembalikan ke Mode Acak
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.options.map((opt, idx) => {
              const color = getSegmentColor(idx, state.options.length);
              const isSelected = state.forcedWinnerId === opt.id;
              const label = opt.text.trim() || `Opsi ${idx + 1}`;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={updatingTarget}
                  onClick={() =>
                    void handleSelectTarget(isSelected ? null : opt.id)
                  }
                  className={`text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/70 shadow-sm"
                      : "border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-slate-400 block">
                        Segmen #{idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate block">
                        {label}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600 text-white shrink-0">
                      Target Terpilih
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Riwayat Putaran */}
        {state.spinHistory.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              Riwayat Putaran Terakhir
            </h2>
            <div className="flex flex-wrap gap-2">
              {state.spinHistory.map((item, idx) => (
                <span
                  key={`${item.text}-${idx}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.text}</span>
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

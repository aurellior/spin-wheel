"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Login gagal. Periksa kembali kredensial.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center shadow-md mb-3">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Admin Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Masuk untuk memantau &amp; mengatur hasil putaran roda
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username admin"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
          >
            &larr; Kembali ke Halaman Roda Undian
          </Link>
        </div>
      </div>
    </div>
  );
}

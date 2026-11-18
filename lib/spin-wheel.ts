export interface WheelOption {
  id: string;
  text: string;
}

export interface WinnerInfo {
  id: string;
  text: string;
  color: string;
}

export interface SpinHistoryItem {
  text: string;
  color: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
}

export const STORAGE_KEY_OPTIONS = "spin_wheel_options_v1";
export const STORAGE_KEY_MUTED = "spin_wheel_muted_v1";
export const STORAGE_KEY_HISTORY = "spin_wheel_history_v1";

export const SEGMENT_PALETTE = [
  "#EF4444", // Merah Coral
  "#F59E0B", // Kuning Amber
  "#10B981", // Hijau Emerald
  "#3B82F6", // Biru Cerah
  "#8B5CF6", // Ungu Violet
  "#EC4899", // Merah Muda Rose
  "#06B6D4", // Biru Cyan
  "#F97316", // Oranye
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#84CC16", // Hijau Lime
  "#D946EF", // Fuchsia
];

export const DEFAULT_OPTIONS = [
  "Hadiah Utama",
  "Voucher 100K",
  "Kopi Gratis",
  "Diskon 50%",
  "Bonus Spesial",
  "Coba Lagi",
];

export function generateOptionId(): string {
  return (
    "opt_" +
    Math.random().toString(36).substring(2, 9) +
    "_" +
    Date.now().toString(36)
  );
}

export function getSegmentColor(index: number, total: number): string {
  let colorIdx = index % SEGMENT_PALETTE.length;
  // Hindari segmen terakhir memiliki warna yang sama dengan segmen pertama
  if (index === total - 1 && total > 1 && colorIdx === 0) {
    colorIdx = 2;
  }
  return SEGMENT_PALETTE[colorIdx];
}

/**
 * Menghitung indeks segmen yang saat ini berada tepat di bawah jarum penunjuk atas (3*PI / 2)
 */
export function getSegmentIndexAtPointer(
  angleRad: number,
  count: number
): number {
  if (count === 0) return -1;

  const TWO_PI = Math.PI * 2;
  const POINTER_ANGLE = (3 * Math.PI) / 2;
  const sliceAngle = TWO_PI / count;

  const localAngle =
    (((POINTER_ANGLE - angleRad) % TWO_PI) + TWO_PI) % TWO_PI;
  return Math.floor(localAngle / sliceAngle) % count;
}

class SoundEffects {
  private audioCtx: AudioContext | null = null;

  ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playTick(isMuted: boolean, speedFactor = 1): void {
    if (isMuted) return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 620 + Math.min(240, speedFactor * 180);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.032);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.038);
    } catch {
      // Abaikan jika browser memblokir audio sebelum interaksi
    }
  }

  playWin(isMuted: boolean): void {
    if (isMuted) return;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.09;
        const duration = idx === notes.length - 1 ? 0.65 : 0.35;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
      });
    } catch {
      // Abaikan error audio
    }
  }
}

export const soundEffects = new SoundEffects();

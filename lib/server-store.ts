import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_OPTIONS,
  type SpinHistoryItem,
  type WheelOption,
} from "@/lib/spin-wheel";

export interface WheelServerState {
  options: WheelOption[];
  forcedWinnerId: string | null;
  spinHistory: SpinHistoryItem[];
  updatedAt: number;
}

export interface PublicWheelState {
  options: WheelOption[];
  spinHistory: SpinHistoryItem[];
  updatedAt: number;
}

type StateListener = (state: WheelServerState) => void;

interface GlobalStore {
  state: WheelServerState;
  listeners: Set<StateListener>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "wheel-state.json");

function createInitialState(): WheelServerState {
  return {
    options: DEFAULT_OPTIONS.map((text, idx) => ({
      id: `default_${idx}`,
      text,
    })),
    forcedWinnerId: null,
    spinHistory: [],
    updatedAt: Date.now(),
  };
}

function loadStateFromDisk(): WheelServerState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<WheelServerState>;
      if (Array.isArray(parsed.options) && parsed.options.length >= 2) {
        return {
          options: parsed.options.filter(
            (o): o is WheelOption =>
              Boolean(o) &&
              typeof o.id === "string" &&
              typeof o.text === "string"
          ),
          forcedWinnerId:
            typeof parsed.forcedWinnerId === "string"
              ? parsed.forcedWinnerId
              : null,
          spinHistory: Array.isArray(parsed.spinHistory)
            ? parsed.spinHistory.slice(0, 8)
            : [],
          updatedAt:
            typeof parsed.updatedAt === "number"
              ? parsed.updatedAt
              : Date.now(),
        };
      }
    }
  } catch {
    // Gunakan state bawaan jika file corrupt atau belum ada
  }
  return createInitialState();
}

function saveStateToDisk(state: WheelServerState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Abaikan jika filesystem read-only
  }
}

const globalForStore = globalThis as unknown as {
  __spinWheelStore?: GlobalStore;
};

function getStore(): GlobalStore {
  if (!globalForStore.__spinWheelStore) {
    globalForStore.__spinWheelStore = {
      state: loadStateFromDisk(),
      listeners: new Set<StateListener>(),
    };
  }
  return globalForStore.__spinWheelStore;
}

function notifyListeners(store: GlobalStore): void {
  saveStateToDisk(store.state);
  for (const listener of store.listeners) {
    try {
      listener(store.state);
    } catch {
      store.listeners.delete(listener);
    }
  }
}

export function getAdminState(): WheelServerState {
  return getStore().state;
}

export function getPublicState(): PublicWheelState {
  const { options, spinHistory, updatedAt } = getStore().state;
  return { options, spinHistory, updatedAt };
}

export function updateOptions(nextOptions: WheelOption[]): WheelServerState {
  const store = getStore();
  const sanitized = nextOptions
    .filter((o) => o && typeof o.id === "string" && typeof o.text === "string")
    .map((o) => ({
      id: o.id,
      text: o.text.slice(0, 45),
    }));

  if (sanitized.length < 2) {
    return store.state;
  }

  // Jika target terpilih sudah dihapus oleh user, reset forcedWinnerId ke null
  const targetStillExists = store.state.forcedWinnerId
    ? sanitized.some((o) => o.id === store.state.forcedWinnerId)
    : false;

  store.state = {
    ...store.state,
    options: sanitized,
    forcedWinnerId: targetStillExists ? store.state.forcedWinnerId : null,
    updatedAt: Date.now(),
  };

  notifyListeners(store);
  return store.state;
}

export function setForcedWinner(targetId: string | null): WheelServerState {
  const store = getStore();
  const validTarget =
    targetId && store.state.options.some((o) => o.id === targetId)
      ? targetId
      : null;

  store.state = {
    ...store.state,
    forcedWinnerId: validTarget,
    updatedAt: Date.now(),
  };

  notifyListeners(store);
  return store.state;
}

export function resolveSpinTarget(): {
  targetIndex: number;
  offsetFraction: number;
} {
  const store = getStore();
  const { options, forcedWinnerId } = store.state;
  const count = options.length;

  if (count === 0) {
    return { targetIndex: 0, offsetFraction: 0.5 };
  }

  if (forcedWinnerId) {
    const forcedIndex = options.findIndex((o) => o.id === forcedWinnerId);
    if (forcedIndex !== -1) {
      // Variasi posisi berhenti alami (22% - 78% dari lebar segmen)
      const offsetFraction = 0.22 + Math.random() * 0.56;
      return { targetIndex: forcedIndex, offsetFraction };
    }
  }

  // Mode acak normal (ditentukan server)
  const randomIndex = Math.floor(Math.random() * count);
  const offsetFraction = 0.12 + Math.random() * 0.76;
  return { targetIndex: randomIndex, offsetFraction };
}

export function completeSpin(winnerItem: SpinHistoryItem): WheelServerState {
  const store = getStore();
  const nextHistory = [winnerItem, ...store.state.spinHistory].slice(0, 8);

  store.state = {
    ...store.state,
    forcedWinnerId: null, // Otomatis reset ke null setelah spin selesai
    spinHistory: nextHistory,
    updatedAt: Date.now(),
  };

  notifyListeners(store);
  return store.state;
}

export function clearSpinHistory(): WheelServerState {
  const store = getStore();
  store.state = {
    ...store.state,
    spinHistory: [],
    updatedAt: Date.now(),
  };
  notifyListeners(store);
  return store.state;
}

export function subscribeState(listener: StateListener): () => void {
  const store = getStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}

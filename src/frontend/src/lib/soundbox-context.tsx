import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "neon-vault.soundbox";

interface SoundboxSettings {
  enabled: boolean;
  volume: number;
}

interface SoundboxContextValue extends SoundboxSettings {
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
}

const SoundboxContext = createContext<SoundboxContextValue | null>(null);

function readStored(): SoundboxSettings {
  if (typeof window === "undefined") return { enabled: true, volume: 0.7 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: true, volume: 0.7 };
    const parsed = JSON.parse(raw) as Partial<SoundboxSettings>;
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : true,
      volume:
        typeof parsed.volume === "number"
          ? Math.max(0, Math.min(1, parsed.volume))
          : 0.7,
    };
  } catch {
    return { enabled: true, volume: 0.7 };
  }
}

/** Soundbox preferences are device-local UI settings, not backend data. */
export function SoundboxProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SoundboxSettings>(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage may be unavailable; preferences simply won't persist.
    }
  }, [settings]);

  const setEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings((prev) => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume)),
    }));
  }, []);

  const value = useMemo<SoundboxContextValue>(
    () => ({ ...settings, setEnabled, setVolume }),
    [settings, setEnabled, setVolume],
  );

  return (
    <SoundboxContext.Provider value={value}>
      {children}
    </SoundboxContext.Provider>
  );
}

export function useSoundbox(): SoundboxContextValue {
  const ctx = useContext(SoundboxContext);
  if (!ctx) throw new Error("useSoundbox must be used within SoundboxProvider");
  return ctx;
}

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

const UXContext = createContext(null);

const STORAGE_KEYS = {
  theme: "crimson_theme",
  textScale: "crimson_text_scale",
  reducedMotion: "crimson_reduced_motion",
};

export function UXProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  const [textScale, setTextScale] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.textScale);
    return ["normal", "large", "xl"].includes(saved) ? saved : "normal";
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.reducedMotion);
    if (saved === "true" || saved === "false") return saved === "true";
    return typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
      ? true
      : false;
  });

  const [toasts, setToasts] = useState([]);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-text-scale", textScale);
    localStorage.setItem(STORAGE_KEYS.textScale, textScale);
  }, [textScale]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-reduced-motion", String(reducedMotion));
    localStorage.setItem(STORAGE_KEYS.reducedMotion, String(reducedMotion));
  }, [reducedMotion]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (title, options = {}) => {
      const { description = "", type = "info", duration = 3800 } = options;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, type }]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
      return id;
    },
    []
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = {
    theme,
    setTheme,
    toggleTheme,
    textScale,
    setTextScale,
    reducedMotion,
    setReducedMotion,
    notify,
    dismissToast,
    upgradeModalOpen,
    setUpgradeModalOpen,
  };

  return (
    <UXContext.Provider value={value}>
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
        {children}
        <ToastRegion toasts={toasts} onDismiss={dismissToast} />
      </MotionConfig>
    </UXContext.Provider>
  );
}

export function useUX() {
  const ctx = useContext(UXContext);
  if (!ctx) {
    throw new Error("useUX must be used inside UXProvider");
  }
  return ctx;
}

const TOAST_STYLES = {
  success:
    "border-emerald-500/40 bg-surface-card text-ink-primary shadow-card",
  error:
    "border-crimson-600/60 bg-surface-card text-ink-primary shadow-crimson",
  warning:
    "border-amber-500/50 bg-surface-card text-ink-primary shadow-card",
  info:
    "border-line-strong bg-surface-card text-ink-primary shadow-card",
};

const TOAST_BADGE = {
  success: "bg-emerald-600 text-white",
  error: "bg-crimson-600 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-crimson-700 text-white",
};

const TOAST_ICON = {
  success: "OK",
  error: "!",
  warning: "!",
  info: "i",
};

function ToastRegion({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
            TOAST_STYLES[toast.type] || TOAST_STYLES.info
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold font-mono ${
              TOAST_BADGE[toast.type] || TOAST_BADGE.info
            }`}
          >
            {TOAST_ICON[toast.type] || "i"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug">{toast.title}</p>
            {toast.description && (
              <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
                {toast.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-ink-muted hover:text-ink-primary hover:bg-surface-elevated"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

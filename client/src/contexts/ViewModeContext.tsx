/*
 * ViewModeContext: Toggle between Expert and Executive dashboard views.
 * Expert mode: full technical detail (default).
 * Executive mode: simplified explanations, role-based advice, actionable takeaways.
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type ViewMode = "expert" | "executive";

interface ViewModeContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isExecutive: boolean;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") return "expert";
  const urlMode = new URLSearchParams(window.location.search).get("view");
  if (urlMode === "expert" || urlMode === "executive") return urlMode;
  try {
    const stored = localStorage.getItem("dashboard-view-mode");
    if (stored === "expert" || stored === "executive") return stored;
  } catch {}
  return "expert";
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(getInitialViewMode);

  const setViewMode = useCallback((newMode: ViewMode) => {
    setViewModeState(newMode);
    const url = new URL(window.location.href);
    url.searchParams.set("view", newMode);
    window.history.pushState(window.history.state, "", url);
    try {
      localStorage.setItem("dashboard-view-mode", newMode);
    } catch {}
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const urlMode = new URLSearchParams(window.location.search).get("view");
      const nextMode = urlMode === "expert" || urlMode === "executive" ? urlMode : getInitialViewMode();
      setViewModeState(nextMode);
      try {
        localStorage.setItem("dashboard-view-mode", nextMode);
      } catch {}
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, isExecutive: viewMode === "executive" }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}

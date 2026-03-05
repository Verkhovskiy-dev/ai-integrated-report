/*
 * ViewModeContext: Toggle between Expert and Executive dashboard views.
 * Expert mode: full technical detail (default).
 * Executive mode: simplified explanations, role-based advice, actionable takeaways.
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ViewMode = "expert" | "executive";

interface ViewModeContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isExecutive: boolean;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

function getInitialViewMode(): ViewMode {
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
    try {
      localStorage.setItem("dashboard-view-mode", newMode);
    } catch {}
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

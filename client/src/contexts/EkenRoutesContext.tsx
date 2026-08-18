import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EkenScenarioRegistry } from "@/data/ekenScenarioRoutes";

interface EkenRoutesContextValue {
  registry: EkenScenarioRegistry | null;
  loading: boolean;
}

const EkenRoutesContext = createContext<EkenRoutesContextValue>({ registry: null, loading: true });

export function EkenRoutesProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<EkenScenarioRegistry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const base = import.meta.env.BASE_URL?.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL || "/"}/`;
    fetch(`${base}data/eken-scenarios.json`)
      .then((response) => response.ok ? response.json() : null)
      .then((value: EkenScenarioRegistry | null) => {
        if (active) setRegistry(value);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({ registry, loading }), [registry, loading]);
  return <EkenRoutesContext.Provider value={value}>{children}</EkenRoutesContext.Provider>;
}

export function useEkenRoutes() {
  return useContext(EkenRoutesContext);
}

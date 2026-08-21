import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface FilterState {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedLevels: number[];
  toggleLevel: (level: number) => void;
  clearLevels: () => void;
  selectAllLevels: () => void;
  isLevelSelected: (level: number) => boolean;
  hasActiveFilters: boolean;
}

const FilterContext = createContext<FilterState | null>(null);

const ALL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function readFiltersFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const searchQuery = params.get("q") ?? "";
  const selectedLevels = Array.from(
    new Set(
      (params.get("levels") ?? "")
        .split(",")
        .map(Number)
        .filter((level) => ALL_LEVELS.includes(level))
    )
  ).sort((a, b) => a - b);

  return { searchQuery, selectedLevels };
}

function replaceFilterParams(searchQuery: string, selectedLevels: number[]) {
  const url = new URL(window.location.href);
  if (searchQuery.trim()) url.searchParams.set("q", searchQuery);
  else url.searchParams.delete("q");

  if (selectedLevels.length) {
    url.searchParams.set("levels", [...selectedLevels].sort((a, b) => a - b).join(","));
  } else {
    url.searchParams.delete("levels");
  }

  window.history.replaceState(window.history.state, "", url);
}

function getInitialFilters() {
  if (typeof window === "undefined") return { searchQuery: "", selectedLevels: [] as number[] };
  return readFiltersFromSearch(window.location.search);
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const initialFilters = getInitialFilters();
  const [searchQuery, setSearchQueryState] = useState(initialFilters.searchQuery);
  const [selectedLevels, setSelectedLevels] = useState<number[]>(initialFilters.selectedLevels);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    replaceFilterParams(query, selectedLevels);
  }, [selectedLevels]);

  const toggleLevel = (level: number) => {
    setSelectedLevels((prev) => {
      const next = prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level];
      replaceFilterParams(searchQuery, next);
      return next;
    });
  };

  const clearLevels = () => {
    setSelectedLevels([]);
    replaceFilterParams(searchQuery, []);
  };
  const selectAllLevels = () => {
    setSelectedLevels([...ALL_LEVELS]);
    replaceFilterParams(searchQuery, ALL_LEVELS);
  };
  const isLevelSelected = (level: number) =>
    selectedLevels.length === 0 || selectedLevels.includes(level);

  const hasActiveFilters = searchQuery.length > 0 || selectedLevels.length > 0;

  useEffect(() => {
    const syncFromUrl = () => {
      const next = readFiltersFromSearch(window.location.search);
      setSearchQueryState(next.searchQuery);
      setSelectedLevels(next.selectedLevels);
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        selectedLevels,
        toggleLevel,
        clearLevels,
        selectAllLevels,
        isLevelSelected,
        hasActiveFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}

import { createContext, useContext, useState, type ReactNode } from "react";

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

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);

  const toggleLevel = (level: number) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const clearLevels = () => setSelectedLevels([]);
  const selectAllLevels = () => setSelectedLevels([...ALL_LEVELS]);
  const isLevelSelected = (level: number) =>
    selectedLevels.length === 0 || selectedLevels.includes(level);

  const hasActiveFilters = searchQuery.length > 0 || selectedLevels.length > 0;

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

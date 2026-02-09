import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

export type ListSize = 20 | 40 | 60 | 100 | 200 | "all";

export const LIST_SIZE_OPTIONS: { value: ListSize; label: string }[] = [
  { value: 20, label: "20" },
  { value: 40, label: "40" },
  { value: 60, label: "60" },
  { value: 100, label: "100" },
  { value: 200, label: "200" },
  { value: "all", label: "All" },
];

interface ListSizeSelectorProps {
  storageKey: string;
  value: ListSize;
  onChange: (size: ListSize) => void;
  totalCount?: number;
  className?: string;
}

export function ListSizeSelector({ storageKey, value, onChange, totalCount, className }: ListSizeSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <span className="text-sm text-muted-foreground whitespace-nowrap">Show:</span>
      <Select
        value={String(value)}
        onValueChange={(val) => {
          const newSize = val === "all" ? "all" : parseInt(val) as ListSize;
          onChange(newSize);
          localStorage.setItem(storageKey, String(newSize));
        }}
      >
        <SelectTrigger className="w-[80px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {LIST_SIZE_OPTIONS.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {totalCount !== undefined && (
        <span className="text-xs text-muted-foreground">
          of {totalCount}
        </span>
      )}
    </div>
  );
}

export function useListSize(storageKey: string, defaultSize: ListSize = 20): [ListSize, (size: ListSize) => void] {
  const [size, setSize] = useState<ListSize>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "all") return "all";
    const parsed = parseInt(stored || "");
    if ([20, 40, 60, 100, 200].includes(parsed)) return parsed as ListSize;
    return defaultSize;
  });

  const updateSize = (newSize: ListSize) => {
    setSize(newSize);
    localStorage.setItem(storageKey, String(newSize));
  };

  return [size, updateSize];
}

// Helper to apply limit to an array
export function applyListLimit<T>(items: T[], size: ListSize): T[] {
  if (size === "all") return items;
  return items.slice(0, size);
}

// Paginated list hook - combines useListSize with page state
export function usePaginatedList<T>(
  storageKey: string,
  items: T[],
  defaultSize: ListSize = 20
): {
  pageSize: ListSize;
  setPageSize: (size: ListSize) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  paginatedItems: T[];
  totalItems: number;
  startIndex: number;
  endIndex: number;
} {
  const [pageSize, setPageSize] = useListSize(storageKey, defaultSize);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when items change length or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, pageSize]);

  if (pageSize === "all") {
    return {
      pageSize,
      setPageSize,
      currentPage: 1,
      setCurrentPage,
      totalPages: 1,
      paginatedItems: items,
      totalItems: items.length,
      startIndex: 0,
      endIndex: items.length,
    };
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, items.length);
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    pageSize,
    setPageSize,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    startIndex,
    endIndex,
  };
}

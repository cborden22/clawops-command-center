import { useCallback, useMemo, useState } from "react";

export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const visibleIds = useMemo(() => items.map((i) => i.id), [items]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(visibleIds);
  }, [visibleIds]);

  const exitSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectionMode(false);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.includes(i.id)),
    [items, selectedIds]
  );

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return {
    selectedIds,
    selectedItems,
    selectionMode,
    setSelectionMode,
    toggle,
    clear,
    exitSelection,
    selectAllVisible,
    isSelected,
    allVisibleSelected,
  };
}

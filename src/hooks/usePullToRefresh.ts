import { useRef, useCallback, useState, useEffect } from "react";
import { useIsMobile } from "./use-mobile";
import { triggerHaptic, hapticPatterns } from "@/utils/haptics";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  isRefreshing?: boolean;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isPulling: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  isRefreshing = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredHaptic = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!containerRef.current || isRefreshing) return;
    
    // Only activate if at top of scroll
    if (containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      hasTriggeredHaptic.current = false;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance - pull distance is reduced as you pull further
      const resistance = 0.5;
      const newPullDistance = Math.min(diff * resistance, threshold * 1.5);
      
      // Trigger haptic when crossing threshold
      if (newPullDistance >= threshold && !hasTriggeredHaptic.current) {
        triggerHaptic(hapticPatterns.refresh);
        hasTriggeredHaptic.current = true;
      } else if (newPullDistance < threshold && hasTriggeredHaptic.current) {
        hasTriggeredHaptic.current = false;
      }
      
      setPullDistance(newPullDistance);
      
      // Prevent default scroll when pulling
      if (containerRef.current && containerRef.current.scrollTop <= 0) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    if (pullDistance >= threshold && !isRefreshing) {
      // Trigger haptic on release when refreshing
      triggerHaptic(hapticPatterns.success);
      // Trigger refresh
      await onRefresh();
    }
    
    // Reset
    setPullDistance(0);
    setIsPulling(false);
    startY.current = 0;
    currentY.current = 0;
    hasTriggeredHaptic.current = false;
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    if (!isMobile) return;
    
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Reset pull distance when refresh completes
  useEffect(() => {
    if (!isRefreshing) {
      setPullDistance(0);
    }
  }, [isRefreshing]);

  if (!isMobile) {
    return {
      pullDistance: 0,
      isPulling: false,
      containerRef,
    };
  }

  return {
    pullDistance,
    isPulling,
    containerRef,
  };
}

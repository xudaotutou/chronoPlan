import { useEffect, useRef, useState } from "react";

const ANIMATION_TIME = 2000;

/**
 * Tracks changes in data and provides animation state for UI feedback when data updates.
 * When the input data changes, this hook returns true for showAnimation for a brief period
 * to allow UI components to display visual feedback (like highlighting or pulsing effects).
 *
 * @param data - The data value to track for changes. Can be any type.
 * @returns {Object} An object containing:
 *   - showAnimation: boolean - Boolean indicating if the animation should be shown (true when data has changed, false after animation period)
 */
export function useAnimationConfig(data: unknown) {
  const [showAnimation, setShowAnimation] = useState(false);
  const prevDataRef = useRef<unknown>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timeout on data change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (prevDataRef.current !== undefined && prevDataRef.current !== data) {
      setShowAnimation(true);
      timeoutRef.current = setTimeout(() => {
        setShowAnimation(false);
        timeoutRef.current = null;
      }, ANIMATION_TIME);
    }

    // Update ref after checking
    prevDataRef.current = data;

    // Cleanup on unmount or data change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [data]);

  return {
    showAnimation,
  };
}

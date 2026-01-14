// Trigger haptic feedback if supported
export function triggerHaptic(pattern: number | number[] = 50) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration not allowed
    }
  }
}

// Preset patterns
export const hapticPatterns = {
  light: 10,           // Quick tap
  medium: 50,          // Normal feedback
  success: [50, 30, 50], // Double pulse for success
  refresh: 30,         // Subtle feedback for refresh trigger
};

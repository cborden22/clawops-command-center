import { useState, useRef, useCallback, useEffect } from "react";

export interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GpsTrackingState {
  isTracking: boolean;
  distanceMeters: number;
  distanceMiles: number;
  currentPosition: GpsPosition | null;
  startPosition: GpsPosition | null;
  positions: GpsPosition[];
  error: string | null;
  accuracy: number | null;
  elapsedSeconds: number;
  isPermissionDenied: boolean;
}

// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate distance between two points using Haversine formula
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert meters to miles
function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

// Minimum distance in meters to count as movement (filter out GPS jitter)
const MIN_DISTANCE_THRESHOLD = 10;

// Minimum accuracy in meters to accept a position
const MAX_ACCEPTABLE_ACCURACY = 50;

export function useGpsTracking() {
  const [state, setState] = useState<GpsTrackingState>({
    isTracking: false,
    distanceMeters: 0,
    distanceMiles: 0,
    currentPosition: null,
    startPosition: null,
    positions: [],
    error: null,
    accuracy: null,
    elapsedSeconds: 0,
    isPermissionDenied: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const positionsRef = useRef<GpsPosition[]>([]);
  const totalDistanceRef = useRef<number>(0);

  // Update elapsed time every second while tracking
  useEffect(() => {
    if (state.isTracking && startTimeRef.current) {
      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setState((prev) => ({ ...prev, elapsedSeconds: elapsed }));
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [state.isTracking]);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const newPos: GpsPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    // Update current position and accuracy
    setState((prev) => ({
      ...prev,
      currentPosition: newPos,
      accuracy: position.coords.accuracy,
      error: null,
    }));

    // Only count positions with acceptable accuracy
    if (position.coords.accuracy > MAX_ACCEPTABLE_ACCURACY) {
      return;
    }

    // Calculate distance from last position
    const positions = positionsRef.current;
    if (positions.length > 0) {
      const lastPos = positions[positions.length - 1];
      const distance = haversineDistance(
        lastPos.lat,
        lastPos.lng,
        newPos.lat,
        newPos.lng
      );

      // Only count if we've moved more than the threshold
      if (distance >= MIN_DISTANCE_THRESHOLD) {
        totalDistanceRef.current += distance;
        positionsRef.current = [...positions, newPos];

        setState((prev) => ({
          ...prev,
          distanceMeters: totalDistanceRef.current,
          distanceMiles: metersToMiles(totalDistanceRef.current),
          positions: positionsRef.current,
        }));
      }
    } else {
      // First position - set as start
      positionsRef.current = [newPos];
      setState((prev) => ({
        ...prev,
        startPosition: newPos,
        positions: [newPos],
      }));
    }
  }, []);

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = "Unable to get location";
    let isPermissionDenied = false;

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied. Please enable location access in your browser settings.";
        isPermissionDenied = true;
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable. Please check your GPS signal.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please try again.";
        break;
    }

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isPermissionDenied,
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    // Reset state for new tracking session
    positionsRef.current = [];
    totalDistanceRef.current = 0;
    startTimeRef.current = Date.now();

    setState({
      isTracking: true,
      distanceMeters: 0,
      distanceMiles: 0,
      currentPosition: null,
      startPosition: null,
      positions: [],
      error: null,
      accuracy: null,
      elapsedSeconds: 0,
      isPermissionDenied: false,
    });

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [handlePositionUpdate, handlePositionError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const finalState = {
      ...state,
      isTracking: false,
      distanceMeters: totalDistanceRef.current,
      distanceMiles: metersToMiles(totalDistanceRef.current),
    };

    setState((prev) => ({ ...prev, isTracking: false }));

    return {
      distanceMeters: totalDistanceRef.current,
      distanceMiles: metersToMiles(totalDistanceRef.current),
      startPosition: positionsRef.current[0] || null,
      endPosition: positionsRef.current[positionsRef.current.length - 1] || null,
      elapsedSeconds: startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0,
    };
  }, [state]);

  const resetTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    positionsRef.current = [];
    totalDistanceRef.current = 0;
    startTimeRef.current = null;

    setState({
      isTracking: false,
      distanceMeters: 0,
      distanceMiles: 0,
      currentPosition: null,
      startPosition: null,
      positions: [],
      error: null,
      accuracy: null,
      elapsedSeconds: 0,
      isPermissionDenied: false,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Get signal strength label based on accuracy
  const getSignalStrength = useCallback((accuracy: number | null): string => {
    if (accuracy === null) return "Unknown";
    if (accuracy <= 10) return "Excellent";
    if (accuracy <= 25) return "Good";
    if (accuracy <= 50) return "Fair";
    return "Weak";
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    resetTracking,
    getSignalStrength,
  };
}

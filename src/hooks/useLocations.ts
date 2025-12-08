import { useState, useEffect } from "react";

export interface Location {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  machineCount: number;
  commissionRate: number;
  notes: string;
  createdAt: string;
  isActive: boolean;
}

const LOCATIONS_STORAGE_KEY = "clawops-locations";

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (saved) {
      try {
        setLocations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load locations:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(locations));
    }
  }, [locations, isLoaded]);

  const addLocation = (locationData: Omit<Location, "id" | "createdAt">) => {
    const newLocation: Location = {
      ...locationData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLocations((prev) => [...prev, newLocation]);
    return newLocation;
  };

  const updateLocation = (id: string, updates: Partial<Location>) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, ...updates } : loc))
    );
  };

  const deleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  const getLocationById = (id: string) => {
    return locations.find((loc) => loc.id === id);
  };

  const activeLocations = locations.filter((loc) => loc.isActive);

  return {
    locations,
    activeLocations,
    isLoaded,
    addLocation,
    updateLocation,
    deleteLocation,
    getLocationById,
  };
}

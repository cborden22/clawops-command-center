import { useState, useEffect } from "react";

export interface CommissionSummaryRecord {
  id: string;
  locationId: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  commissionPercentage: number;
  commissionAmount: number;
  machineCount: number;
  notes: string;
  createdAt: string;
}

export interface LocationAgreementRecord {
  id: string;
  locationId: string;
  agreementDate: string;
  startDate: string;
  endDate: string;
  providerName: string;
  providerAddress: string;
  providerContact: string;
  paymentType: "percentage" | "flat";
  revenueSharePercentage?: number;
  flatFeeAmount?: number;
  paymentMethod: string;
  noticePeriod: string;
  createdAt: string;
}

export interface MachineType {
  type: "claw" | "bulk" | "clip" | "sticker" | "other";
  label: string;
  count: number;
}

export const MACHINE_TYPE_OPTIONS: { value: MachineType["type"]; label: string }[] = [
  { value: "claw", label: "Claw Machine" },
  { value: "bulk", label: "Bulk Machine" },
  { value: "clip", label: "Clip Machine" },
  { value: "sticker", label: "Sticker Machine" },
  { value: "other", label: "Other" },
];

export interface Location {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  machineCount: number;
  machines: MachineType[];
  commissionRate: number;
  notes: string;
  createdAt: string;
  isActive: boolean;
  commissionSummaries: CommissionSummaryRecord[];
  agreements: LocationAgreementRecord[];
}

const LOCATIONS_STORAGE_KEY = "clawops-locations";

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old data: add empty arrays if missing
        const migrated = parsed.map((loc: Location) => ({
          ...loc,
          commissionSummaries: loc.commissionSummaries || [],
          agreements: loc.agreements || [],
          machines: loc.machines || [],
        }));
        setLocations(migrated);
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

  const addLocation = (locationData: Omit<Location, "id" | "createdAt" | "commissionSummaries" | "agreements" | "machines"> & { machines?: MachineType[] }) => {
    const newLocation: Location = {
      ...locationData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      commissionSummaries: [],
      agreements: [],
      machines: locationData.machines || [],
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

  const addCommissionSummary = (locationId: string, summary: Omit<CommissionSummaryRecord, "id" | "locationId" | "createdAt">) => {
    const newSummary: CommissionSummaryRecord = {
      ...summary,
      id: crypto.randomUUID(),
      locationId,
      createdAt: new Date().toISOString(),
    };
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? { ...loc, commissionSummaries: [...loc.commissionSummaries, newSummary] }
          : loc
      )
    );
    return newSummary;
  };

  const addAgreement = (locationId: string, agreement: Omit<LocationAgreementRecord, "id" | "locationId" | "createdAt">) => {
    const newAgreement: LocationAgreementRecord = {
      ...agreement,
      id: crypto.randomUUID(),
      locationId,
      createdAt: new Date().toISOString(),
    };
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? { ...loc, agreements: [...loc.agreements, newAgreement] }
          : loc
      )
    );
    return newAgreement;
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
    addCommissionSummary,
    addAgreement,
  };
}

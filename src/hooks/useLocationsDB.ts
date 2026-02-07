import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { slugify, generateUnitCode } from "@/utils/slugify";

// Parse date-only strings (YYYY-MM-DD) as local dates to avoid timezone shifts
const parseDateOnly = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

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
  id?: string; // Database ID for the machine entry
  type: "claw" | "mini_claw" | "bulk" | "clip" | "sticker" | "other";
  label: string;
  count: number;
  customLabel?: string;
  winProbability?: number; // Stored as "1 in X" (e.g., 15 means 1 in 15 odds)
  costPerPlay?: number; // Dollar value per play (e.g., 0.50, 1.00, 2.00)
  unitCode?: string; // Auto-generated unit code for QR URLs (e.g., "claw-1")
}

export const MACHINE_TYPE_OPTIONS: { value: MachineType["type"]; label: string }[] = [
  { value: "claw", label: "Claw Machine" },
  { value: "mini_claw", label: "Mini Claw Machine" },
  { value: "bulk", label: "Bulk Machine" },
  { value: "clip", label: "Clip Machine" },
  { value: "sticker", label: "Sticker Machine" },
  { value: "other", label: "Other" },
];

export interface Location {
  id: string;
  name: string;
  slug?: string; // URL-friendly slug for pretty URLs (auto-generated)
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
  // Scheduling fields
  collectionFrequencyDays?: number;
  restockDayOfWeek?: number; // 0=Sunday, 6=Saturday
  lastCollectionDate?: string;
}

export function useLocations() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchLocations = async () => {
    if (!user) {
      setLocations([]);
      setIsLoaded(true);
      return;
    }

    try {
      // Fetch locations
      // RLS handles access control - owners see own data, team members see owner data via has_team_permission()
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("*")
        .order("created_at", { ascending: false });

      if (locationsError) throw locationsError;

      // Fetch machines for all locations
      const locationIds = locationsData?.map(l => l.id) || [];
      
      let machinesData: any[] = [];
      if (locationIds.length > 0) {
        const { data: machines, error: machinesError } = await supabase
          .from("location_machines")
          .select("*")
          .in("location_id", locationIds);
        
        if (machinesError) throw machinesError;
        machinesData = machines || [];
      }

      // Fetch commission summaries
      let summariesData: any[] = [];
      if (locationIds.length > 0) {
        const { data: summaries, error: summariesError } = await supabase
          .from("commission_summaries")
          .select("*")
          .in("location_id", locationIds);
        
        if (summariesError) throw summariesError;
        summariesData = summaries || [];
      }

      // Fetch agreements
      let agreementsData: any[] = [];
      if (locationIds.length > 0) {
        const { data: agreements, error: agreementsError } = await supabase
          .from("location_agreements")
          .select("*")
          .in("location_id", locationIds);
        
        if (agreementsError) throw agreementsError;
        agreementsData = agreements || [];
      }

      // Map to Location interface
      const mappedLocations: Location[] = (locationsData || []).map(loc => {
        const machines = machinesData
          .filter(m => m.location_id === loc.id)
          .map(m => {
            const defaultLabel = MACHINE_TYPE_OPTIONS.find(opt => opt.value === m.machine_type)?.label || m.machine_type;
            const customLabel = m.custom_label || "";
            return {
              id: m.id, // Include the database ID
              type: m.machine_type as MachineType["type"],
              label: customLabel || defaultLabel,
              count: m.count,
              customLabel,
              winProbability: m.win_probability ? Number(m.win_probability) : undefined,
              costPerPlay: m.cost_per_play ? Number(m.cost_per_play) : 0.50,
              unitCode: m.unit_code || undefined, // Include unit code for QR URLs
            };
          });

        const commissionSummaries = summariesData
          .filter(s => s.location_id === loc.id)
          .map(s => ({
            id: s.id,
            locationId: s.location_id,
            startDate: s.start_date,
            endDate: s.end_date,
            totalRevenue: Number(s.total_revenue) || 0,
            commissionPercentage: Number(s.commission_percentage) || 0,
            commissionAmount: Number(s.commission_amount) || 0,
            machineCount: s.machine_count || 0,
            notes: s.notes || "",
            createdAt: s.created_at,
          }));

        const agreements = agreementsData
          .filter(a => a.location_id === loc.id)
          .map(a => ({
            id: a.id,
            locationId: a.location_id,
            agreementDate: a.agreement_date,
            startDate: a.start_date,
            endDate: a.end_date,
            providerName: a.provider_name || "",
            providerAddress: a.provider_address || "",
            providerContact: a.provider_contact || "",
            paymentType: a.payment_type as "percentage" | "flat",
            revenueSharePercentage: Number(a.revenue_share_percentage) || undefined,
            flatFeeAmount: Number(a.flat_fee_amount) || undefined,
            paymentMethod: a.payment_method || "",
            noticePeriod: a.notice_period || "",
            createdAt: a.created_at,
          }));

        return {
          id: loc.id,
          name: loc.name,
          slug: loc.slug || "", // Include slug for pretty URLs
          address: loc.address || "",
          contactPerson: loc.contact_person || "",
          contactPhone: loc.contact_phone || "",
          contactEmail: loc.contact_email || "",
          machineCount: machines.reduce((sum, m) => sum + m.count, 0),
          machines,
          commissionRate: Number(loc.commission_rate) || 0,
          notes: loc.notes || "",
          createdAt: loc.created_at,
          isActive: loc.is_active ?? true,
          commissionSummaries,
          agreements,
          // Scheduling fields
          collectionFrequencyDays: loc.collection_frequency_days || undefined,
          restockDayOfWeek: loc.restock_day_of_week ?? undefined,
          lastCollectionDate: loc.last_collection_date || undefined,
        };
      });

      setLocations(mappedLocations);
    } catch (error: any) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Error",
        description: "Failed to load locations.",
        variant: "destructive",
      });
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLocations();
    } else {
      setLocations([]);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const addLocation = async (locationData: Omit<Location, "id" | "createdAt" | "commissionSummaries" | "agreements" | "machines"> & { machines?: MachineType[] }) => {
    if (!user) return null;

    try {
      // Auto-generate slug from location name
      const generatedSlug = slugify(locationData.name);
      
      const { data: newLoc, error: locError } = await supabase
        .from("locations")
        .insert({
          user_id: user.id,
          name: locationData.name,
          slug: generatedSlug,
          address: locationData.address,
          contact_person: locationData.contactPerson,
          contact_phone: locationData.contactPhone,
          contact_email: locationData.contactEmail,
          commission_rate: locationData.commissionRate,
          notes: locationData.notes,
          is_active: locationData.isActive,
        })
        .select()
        .single();

      if (locError) throw locError;

      if (locError) throw locError;

      // Add machines if any
      if (locationData.machines && locationData.machines.length > 0) {
        // Group machines by type to generate unit codes
        const typeCounters: Record<string, number> = {};
        
        const machinesInsert = locationData.machines.map(m => {
          const defaultLabel = MACHINE_TYPE_OPTIONS.find(opt => opt.value === m.type)?.label || "";
          const customLabel = m.customLabel || (m.label !== defaultLabel ? m.label : "");
          
          // Generate unit code
          typeCounters[m.type] = (typeCounters[m.type] || 0) + 1;
          const unitCode = generateUnitCode(m.type, typeCounters[m.type]);
          
          return {
            location_id: newLoc.id,
            machine_type: m.type,
            count: m.count,
            custom_label: customLabel || null,
            win_probability: m.winProbability || null,
            cost_per_play: m.costPerPlay ?? 0.50,
            unit_code: unitCode,
          };
        });

        const { error: machinesError } = await supabase
          .from("location_machines")
          .insert(machinesInsert);

        if (machinesError) throw machinesError;
      }

      await fetchLocations();
      return locations.find(l => l.id === newLoc.id) || null;
    } catch (error: any) {
      console.error("Error adding location:", error);
      toast({
        title: "Error",
        description: "Failed to add location.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      if (updates.name !== undefined) {
        updateData.name = updates.name;
        // Regenerate slug if name changes
        updateData.slug = slugify(updates.name);
      }
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.contactPerson !== undefined) updateData.contact_person = updates.contactPerson;
      if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
      if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
      if (updates.commissionRate !== undefined) updateData.commission_rate = updates.commissionRate;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.collectionFrequencyDays !== undefined) updateData.collection_frequency_days = updates.collectionFrequencyDays || null;
      if (updates.restockDayOfWeek !== undefined) updateData.restock_day_of_week = updates.restockDayOfWeek ?? null;
      if (updates.lastCollectionDate !== undefined) updateData.last_collection_date = updates.lastCollectionDate || null;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("locations")
          .update(updateData)
          .eq("id", id);

        if (error) throw error;
      }

      // Update machines if provided
      if (updates.machines !== undefined) {
        // Delete existing machines
        await supabase.from("location_machines").delete().eq("location_id", id);

        // Add new machines with auto-generated unit codes
        if (updates.machines.length > 0) {
          // Group machines by type to generate unit codes
          const typeCounters: Record<string, number> = {};
          
          const machinesInsert = updates.machines.map(m => {
            const defaultLabel = MACHINE_TYPE_OPTIONS.find(opt => opt.value === m.type)?.label || "";
            const customLabel = m.customLabel || (m.label !== defaultLabel ? m.label : "");
            
            // Generate unit code
            typeCounters[m.type] = (typeCounters[m.type] || 0) + 1;
            const unitCode = generateUnitCode(m.type, typeCounters[m.type]);
            
            return {
              location_id: id,
              machine_type: m.type,
              count: m.count,
              custom_label: customLabel || null,
              win_probability: m.winProbability || null,
              cost_per_play: m.costPerPlay ?? 0.50,
              unit_code: unitCode,
            };
          });

          const { error: machinesError } = await supabase
            .from("location_machines")
            .insert(machinesInsert);

          if (machinesError) throw machinesError;
        }
      }

      await fetchLocations();
    } catch (error: any) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: "Failed to update location.",
        variant: "destructive",
      });
    }
  };

  const deleteLocation = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchLocations();
    } catch (error: any) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: "Failed to delete location.",
        variant: "destructive",
      });
    }
  };

  const getLocationById = (id: string) => {
    return locations.find((loc) => loc.id === id);
  };

  const addCommissionSummary = async (locationId: string, summary: Omit<CommissionSummaryRecord, "id" | "locationId" | "createdAt">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("commission_summaries")
        .insert({
          location_id: locationId,
          start_date: summary.startDate,
          end_date: summary.endDate,
          total_revenue: summary.totalRevenue,
          commission_percentage: summary.commissionPercentage,
          commission_amount: summary.commissionAmount,
          machine_count: summary.machineCount,
          notes: summary.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchLocations();
      return data;
    } catch (error: any) {
      console.error("Error adding commission summary:", error);
      toast({
        title: "Error",
        description: "Failed to add commission summary.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteCommissionSummary = async (summaryId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // First, find and delete the related revenue entry (commission payout expense)
      const { data: summary, error: fetchError } = await supabase
        .from("commission_summaries")
        .select("*")
        .eq("id", summaryId)
        .single();

      if (fetchError) throw fetchError;

      // Delete revenue entries that match this commission payout
      // Match by: type = expense, category = Commission Payout, amount = commission_amount, date close to end_date
      if (summary) {
        const endDate = parseDateOnly(summary.end_date);
        const startSearch = new Date(endDate);
        startSearch.setDate(startSearch.getDate() - 1);
        const endSearch = new Date(endDate);
        endSearch.setDate(endSearch.getDate() + 1);

        await supabase
          .from("revenue_entries")
          .delete()
          .eq("user_id", user.id)
          .eq("type", "expense")
          .eq("category", "Commission Payout")
          .eq("amount", summary.commission_amount)
          .gte("date", startSearch.toISOString())
          .lte("date", endSearch.toISOString());
      }

      // Delete the commission summary
      const { error } = await supabase
        .from("commission_summaries")
        .delete()
        .eq("id", summaryId);

      if (error) throw error;

      await fetchLocations();
      return true;
    } catch (error: any) {
      console.error("Error deleting commission summary:", error);
      toast({
        title: "Error",
        description: "Failed to delete commission summary.",
        variant: "destructive",
      });
      return false;
    }
  };

  const addAgreement = async (locationId: string, agreement: Omit<LocationAgreementRecord, "id" | "locationId" | "createdAt">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("location_agreements")
        .insert({
          location_id: locationId,
          agreement_date: agreement.agreementDate,
          start_date: agreement.startDate,
          end_date: agreement.endDate,
          provider_name: agreement.providerName,
          provider_address: agreement.providerAddress,
          provider_contact: agreement.providerContact,
          payment_type: agreement.paymentType,
          revenue_share_percentage: agreement.revenueSharePercentage,
          flat_fee_amount: agreement.flatFeeAmount,
          payment_method: agreement.paymentMethod,
          notice_period: agreement.noticePeriod,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchLocations();
      return data;
    } catch (error: any) {
      console.error("Error adding agreement:", error);
      toast({
        title: "Error",
        description: "Failed to add agreement.",
        variant: "destructive",
      });
      return null;
    }
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
    deleteCommissionSummary,
    addAgreement,
    refetch: fetchLocations,
  };
}

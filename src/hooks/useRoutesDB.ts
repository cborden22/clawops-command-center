import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface RouteStop {
  id: string;
  routeId: string;
  locationId?: string;
  customLocationName?: string;
  stopOrder: number;
  milesFromPrevious: number;
  notes?: string;
}

export interface MileageRoute {
  id: string;
  name: string;
  description?: string;
  totalMiles: number;
  isRoundTrip: boolean;
  stops: RouteStop[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteStopInput {
  locationId?: string;
  customLocationName?: string;
  milesFromPrevious: number;
  notes?: string;
}

export function useRoutes() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<MileageRoute[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchRoutes = async () => {
    if (!user) {
      setRoutes([]);
      setIsLoaded(true);
      return;
    }

    try {
      // Fetch routes
      const { data: routesData, error: routesError } = await supabase
        .from("mileage_routes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (routesError) throw routesError;

      // Fetch all stops for user's routes
      const routeIds = (routesData || []).map(r => r.id);
      let stopsData: any[] = [];
      
      if (routeIds.length > 0) {
        const { data, error: stopsError } = await supabase
          .from("mileage_route_stops")
          .select("*")
          .in("route_id", routeIds)
          .order("stop_order", { ascending: true });

        if (stopsError) throw stopsError;
        stopsData = data || [];
      }

      // Map routes with their stops
      const mappedRoutes: MileageRoute[] = (routesData || []).map(route => ({
        id: route.id,
        name: route.name,
        description: route.description || undefined,
        totalMiles: Number(route.total_miles) || 0,
        isRoundTrip: route.is_round_trip || false,
        stops: stopsData
          .filter(s => s.route_id === route.id)
          .map(s => ({
            id: s.id,
            routeId: s.route_id,
            locationId: s.location_id || undefined,
            customLocationName: s.custom_location_name || undefined,
            stopOrder: s.stop_order,
            milesFromPrevious: Number(s.miles_from_previous) || 0,
            notes: s.notes || undefined,
          })),
        createdAt: new Date(route.created_at),
        updatedAt: new Date(route.updated_at),
      }));

      setRoutes(mappedRoutes);
    } catch (error: any) {
      console.error("Error fetching routes:", error);
      toast({
        title: "Error",
        description: "Failed to load routes.",
        variant: "destructive",
      });
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRoutes();
    } else {
      setRoutes([]);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const addRoute = async (
    name: string,
    description: string | undefined,
    stops: RouteStopInput[],
    isRoundTrip: boolean
  ): Promise<MileageRoute | null> => {
    if (!user) return null;

    // Calculate total miles
    const oneWayMiles = stops.reduce((sum, s) => sum + s.milesFromPrevious, 0);
    const totalMiles = isRoundTrip ? oneWayMiles * 2 : oneWayMiles;

    try {
      // Insert route
      const { data: routeData, error: routeError } = await supabase
        .from("mileage_routes")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          total_miles: totalMiles,
          is_round_trip: isRoundTrip,
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Insert stops
      const stopsToInsert = stops.map((stop, index) => ({
        route_id: routeData.id,
        location_id: stop.locationId || null,
        custom_location_name: stop.customLocationName || null,
        stop_order: index,
        miles_from_previous: stop.milesFromPrevious,
        notes: stop.notes || null,
      }));

      const { data: stopsData, error: stopsError } = await supabase
        .from("mileage_route_stops")
        .insert(stopsToInsert)
        .select();

      if (stopsError) throw stopsError;

      const newRoute: MileageRoute = {
        id: routeData.id,
        name: routeData.name,
        description: routeData.description || undefined,
        totalMiles: Number(routeData.total_miles) || 0,
        isRoundTrip: routeData.is_round_trip || false,
        stops: (stopsData || []).map(s => ({
          id: s.id,
          routeId: s.route_id,
          locationId: s.location_id || undefined,
          customLocationName: s.custom_location_name || undefined,
          stopOrder: s.stop_order,
          milesFromPrevious: Number(s.miles_from_previous) || 0,
          notes: s.notes || undefined,
        })),
        createdAt: new Date(routeData.created_at),
        updatedAt: new Date(routeData.updated_at),
      };

      setRoutes(prev => [newRoute, ...prev]);
      return newRoute;
    } catch (error: any) {
      console.error("Error adding route:", error);
      toast({
        title: "Error",
        description: "Failed to create route.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRoute = async (
    id: string,
    name: string,
    description: string | undefined,
    stops: RouteStopInput[],
    isRoundTrip: boolean
  ): Promise<boolean> => {
    if (!user) return false;

    const oneWayMiles = stops.reduce((sum, s) => sum + s.milesFromPrevious, 0);
    const totalMiles = isRoundTrip ? oneWayMiles * 2 : oneWayMiles;

    try {
      // Update route
      const { error: routeError } = await supabase
        .from("mileage_routes")
        .update({
          name,
          description: description || null,
          total_miles: totalMiles,
          is_round_trip: isRoundTrip,
        })
        .eq("id", id);

      if (routeError) throw routeError;

      // Delete existing stops and insert new ones
      const { error: deleteError } = await supabase
        .from("mileage_route_stops")
        .delete()
        .eq("route_id", id);

      if (deleteError) throw deleteError;

      const stopsToInsert = stops.map((stop, index) => ({
        route_id: id,
        location_id: stop.locationId || null,
        custom_location_name: stop.customLocationName || null,
        stop_order: index,
        miles_from_previous: stop.milesFromPrevious,
        notes: stop.notes || null,
      }));

      const { data: stopsData, error: stopsError } = await supabase
        .from("mileage_route_stops")
        .insert(stopsToInsert)
        .select();

      if (stopsError) throw stopsError;

      // Update local state
      setRoutes(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            name,
            description,
            totalMiles,
            isRoundTrip,
            stops: (stopsData || []).map(s => ({
              id: s.id,
              routeId: s.route_id,
              locationId: s.location_id || undefined,
              customLocationName: s.custom_location_name || undefined,
              stopOrder: s.stop_order,
              milesFromPrevious: Number(s.miles_from_previous) || 0,
              notes: s.notes || undefined,
            })),
            updatedAt: new Date(),
          };
        }
        return r;
      }));

      return true;
    } catch (error: any) {
      console.error("Error updating route:", error);
      toast({
        title: "Error",
        description: "Failed to update route.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteRoute = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("mileage_routes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRoutes(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting route:", error);
      toast({
        title: "Error",
        description: "Failed to delete route.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getRouteById = (id: string): MileageRoute | undefined => {
    return routes.find(r => r.id === id);
  };

  return {
    routes,
    isLoaded,
    addRoute,
    updateRoute,
    deleteRoute,
    getRouteById,
    refetch: fetchRoutes,
  };
}

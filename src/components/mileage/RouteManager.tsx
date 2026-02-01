import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Route, MapPin, Trash2, Pencil, Play, MoreVertical, Map 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MileageRoute, RouteStopInput } from "@/hooks/useRoutesDB";
import { RouteEditor } from "./RouteEditor";
import { RoutePreview } from "./RoutePreview";
import { RouteMap } from "./RouteMap";
import { toast } from "@/hooks/use-toast";

interface RouteManagerProps {
  routes: MileageRoute[];
  onAddRoute: (
    name: string,
    description: string | undefined,
    stops: RouteStopInput[],
    isRoundTrip: boolean
  ) => Promise<MileageRoute | null>;
  onUpdateRoute: (
    id: string,
    name: string,
    description: string | undefined,
    stops: RouteStopInput[],
    isRoundTrip: boolean
  ) => Promise<boolean>;
  onDeleteRoute: (id: string) => Promise<boolean>;
  onUseRoute: (route: MileageRoute) => void;
}

export function RouteManager({
  routes,
  onAddRoute,
  onUpdateRoute,
  onDeleteRoute,
  onUseRoute,
}: RouteManagerProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<MileageRoute | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<MileageRoute | null>(null);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<MileageRoute | undefined>();
  const [showMap, setShowMap] = useState(true);

  const handleCreate = () => {
    setEditingRoute(undefined);
    setEditorOpen(true);
  };

  const handleEdit = (route: MileageRoute) => {
    setEditingRoute(route);
    setEditorOpen(true);
  };

  const handleDelete = (route: MileageRoute) => {
    setRouteToDelete(route);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (routeToDelete) {
      const success = await onDeleteRoute(routeToDelete.id);
      if (success) {
        toast({ title: "Route Deleted", description: `"${routeToDelete.name}" has been removed.` });
      }
    }
    setDeleteDialogOpen(false);
    setRouteToDelete(null);
  };

  const handleSave = async (
    name: string,
    description: string | undefined,
    stops: RouteStopInput[],
    isRoundTrip: boolean
  ): Promise<boolean> => {
    if (editingRoute) {
      const success = await onUpdateRoute(editingRoute.id, name, description, stops, isRoundTrip);
      if (success) {
        toast({ title: "Route Updated", description: `"${name}" has been saved.` });
      }
      return success;
    } else {
      const newRoute = await onAddRoute(name, description, stops, isRoundTrip);
      if (newRoute) {
        toast({ title: "Route Created", description: `"${name}" is ready to use.` });
        return true;
      }
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Save your common routes for quick trip logging
        </p>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="gap-2"
          >
            <Map className="h-4 w-4" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Route
          </Button>
        </div>
      </div>

      {/* Interactive Map */}
      {showMap && (
        <div className="space-y-2">
          <RouteMap selectedRoute={selectedRouteForMap} />
          {selectedRouteForMap && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing: <span className="font-medium text-foreground">{selectedRouteForMap.name}</span>
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedRouteForMap(undefined)}
              >
                Show All Locations
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Routes List */}
      {routes.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-4">No routes saved yet</p>
            <Button onClick={handleCreate} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Route
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map(route => (
            <Card 
              key={route.id} 
              className={`glass-card hover:shadow-hover transition-all duration-300 cursor-pointer ${
                selectedRouteForMap?.id === route.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedRouteForMap(
                selectedRouteForMap?.id === route.id ? undefined : route
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{route.name}</h3>
                    {route.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {route.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUseRoute(route)}>
                        <Play className="h-4 w-4 mr-2" />
                        Log Trip
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(route)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(route)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{route.stops.length} stops</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {route.totalMiles.toFixed(1)} mi
                  </Badge>
                  {route.isRoundTrip && (
                    <Badge variant="outline" className="text-xs">RT</Badge>
                  )}
                </div>

                <RoutePreview route={route} compact />

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 gap-2"
                  onClick={() => onUseRoute(route)}
                >
                  <Play className="h-3.5 w-3.5" />
                  Use This Route
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <RouteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        route={editingRoute}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{routeToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

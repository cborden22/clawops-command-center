import { useState } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, TrendingDown, Minus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useMachineCollections } from "@/hooks/useMachineCollections";
import { useLocations } from "@/hooks/useLocationsDB";
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

interface CollectionReportsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollectionReportsSheet({ open, onOpenChange }: CollectionReportsSheetProps) {
  const { locations } = useLocations();
  const {
    collections,
    getCollectionsGroupedByDate,
    calculateCollectionWinRate,
    formatWinRate,
    formatOdds,
    formatPlays,
    compareToExpected,
    deleteCollection,
  } = useMachineCollections();

  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

  // Filter collections by selected location
  const filteredCollections = selectedLocation === "all"
    ? collections
    : collections.filter((c) => c.locationId === selectedLocation);

  // Group by date
  const groupedByDate = filteredCollections.reduce((acc, c) => {
    const dateKey = c.collectionDate.toISOString().split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(c);
    return acc;
  }, {} as Record<string, typeof collections>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMM d");
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    return location?.name || "Unknown Location";
  };

  const getMachineInfo = (locationId: string, machineId: string) => {
    const location = locations.find((l) => l.id === locationId);
    const machine = location?.machines?.find((m) => m.id === machineId);
    return {
      name: machine?.label || machine?.type || "Unknown Machine",
      winProbability: machine?.winProbability,
      costPerPlay: machine?.costPerPlay || 0.50,
    };
  };

  const getStatusBadge = (status: "over" | "under" | "on-target" | "unknown") => {
    switch (status) {
      case "on-target":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
            <Minus className="h-3 w-3 mr-1" />
            On Target
          </Badge>
        );
      case "over":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Over Paying
          </Badge>
        );
      case "under":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
            <TrendingDown className="h-3 w-3 mr-1" />
            Under Paying
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleDeleteClick = (id: string) => {
    setCollectionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (collectionToDelete) {
      await deleteCollection(collectionToDelete);
      setCollectionToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl h-[85vh] flex flex-col">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-center flex items-center justify-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Collection Reports
            </SheetTitle>
          </SheetHeader>

          {/* Filters */}
          <div className="py-3 border-b">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {filteredCollections.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Target className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">No collections yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Add collection metrics when logging revenue
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-6 pt-2">
                {sortedDates.map((dateKey) => (
                  <div key={dateKey}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {getDateLabel(dateKey)}
                    </p>
                    <div className="space-y-2">
                      {groupedByDate[dateKey].map((collection) => {
                        const machineInfo = getMachineInfo(collection.locationId, collection.machineId);
                        const stats = calculateCollectionWinRate(collection.coinsInserted, collection.prizesWon, machineInfo.costPerPlay);
                        const comparison = machineInfo.winProbability
                          ? compareToExpected(stats.trueWinRate, machineInfo.winProbability)
                          : { status: "unknown" as const, variance: 0, message: "" };
                        const isExpanded = expandedId === collection.id;

                        return (
                          <Card
                            key={collection.id}
                            className="overflow-hidden"
                          >
                            <CardContent className="p-3">
                              <button
                                className="w-full text-left"
                                onClick={() => setExpandedId(isExpanded ? null : collection.id)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {machineInfo.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      @ {getLocationName(collection.locationId)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                  <div className="text-sm">
                                    <span className="font-medium">{formatPlays(stats.totalPlays)}</span>
                                    <span className="text-muted-foreground"> plays → </span>
                                    <span className="font-medium">{collection.prizesWon}</span>
                                    <span className="text-muted-foreground"> prizes</span>
                                  </div>
                                </div>

                                <div className="mt-1 text-xs text-muted-foreground">
                                  ({collection.coinsInserted} coins = ${stats.totalDollars.toFixed(2)})
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">True Win Rate: </span>
                                    <span className="font-medium">
                                      {formatWinRate(stats.trueWinRate)} ({formatOdds(stats.trueOdds)})
                                    </span>
                                  </div>
                                  {getStatusBadge(comparison.status)}
                                </div>
                              </button>

                              {/* Expanded Details */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t space-y-2">
                                  {machineInfo.winProbability && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Expected: </span>
                                      <span>1 in {machineInfo.winProbability}</span>
                                      {comparison.status !== "unknown" && (
                                        <span className="text-muted-foreground ml-1">
                                          ({comparison.message})
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {collection.notes && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Notes: </span>
                                      <span>{collection.notes}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-end pt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(collection.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this collection record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

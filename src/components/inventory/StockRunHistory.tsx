import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, ChevronDown, ChevronUp, Package, RotateCcw, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StockRunItem {
  id: string;
  name: string;
  quantity: number;
}

interface StockRunRecord {
  id: string;
  run_date: string;
  total_items: number;
  total_products: number;
  items: StockRunItem[];
  returned_items: StockRunItem[] | null;
}

interface StockRunHistoryProps {
  refreshTrigger?: number;
}

export function StockRunHistory({ refreshTrigger }: StockRunHistoryProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<StockRunRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchHistory = async () => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("stock_run_history")
        .select("*")
        .eq("user_id", user.id)
        .order("run_date", { ascending: false })
        .limit(20);

      if (error) throw error;

      const mappedHistory: StockRunRecord[] = (data || []).map((record) => ({
        id: record.id,
        run_date: record.run_date,
        total_items: record.total_items,
        total_products: record.total_products,
        items: (record.items as unknown as StockRunItem[]) || [],
        returned_items: record.returned_items as unknown as StockRunItem[] | null,
      }));

      setHistory(mappedHistory);
    } catch (error) {
      console.error("Error fetching stock run history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id, refreshTrigger]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getReturnedTotal = (returned: StockRunItem[] | null) => {
    if (!returned) return 0;
    return returned.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Calculate summary stats
  const thisMonthRuns = history.filter((record) => {
    const runDate = new Date(record.run_date);
    const now = new Date();
    return (
      runDate.getMonth() === now.getMonth() &&
      runDate.getFullYear() === now.getFullYear()
    );
  });

  const avgItemsPerRun =
    history.length > 0
      ? Math.round(
          history.reduce((sum, r) => sum + r.total_items, 0) / history.length
        )
      : 0;

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading history...</span>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return null; // Don't show if no history
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-4 h-auto"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <span className="font-semibold">Stock Run History</span>
          <Badge variant="secondary" className="ml-1">
            {history.length}
          </Badge>
        </div>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </Button>

      {!isCollapsed && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="font-bold">{thisMonthRuns.length} runs</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg per Run</p>
                  <p className="font-bold">{avgItemsPerRun} items</p>
                </div>
              </div>
            </Card>
          </div>

          {/* History List */}
          <div className="space-y-2">
            {history.map((record) => {
              const isExpanded = expandedId === record.id;
              const returnedTotal = getReturnedTotal(record.returned_items);

              return (
                <Card
                  key={record.id}
                  className={cn(
                    "overflow-hidden transition-all",
                    isExpanded && "ring-1 ring-primary/20"
                  )}
                >
                  <Button
                    variant="ghost"
                    className="w-full p-4 h-auto justify-start hover:bg-muted/50"
                    onClick={() => toggleExpand(record.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">
                            {formatDate(record.run_date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(record.run_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {record.total_items} items
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.total_products} products
                          </p>
                        </div>
                        {returnedTotal > 0 && (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-emerald-600 text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            {returnedTotal}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-muted/30">
                      <div className="pt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Items Taken
                        </p>
                        <div className="space-y-1">
                          {record.items.map((item, idx) => {
                            const returnedItem = record.returned_items?.find(
                              (r) => r.id === item.id
                            );
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-sm py-1"
                              >
                                <span className="text-muted-foreground">
                                  {item.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {item.quantity}
                                  </span>
                                  {returnedItem && (
                                    <span className="text-emerald-600 text-xs">
                                      (+{returnedItem.quantity} returned)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {record.returned_items &&
                          record.returned_items.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
                                Total Returned: {returnedTotal} items
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

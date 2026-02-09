import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Plus, Trash2, Loader2 } from "lucide-react";
import { useMachineTypesDB } from "@/hooks/useMachineTypesDB";
import { toast } from "@/hooks/use-toast";

export function MachineTypeManager() {
  const { machineTypes, isLoaded, addType, removeType } = useMachineTypesDB();
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;

    setIsAdding(true);
    const success = await addType(label);
    if (success) {
      setNewLabel("");
      toast({ title: "Machine Type Added", description: `"${label}" is now available.` });
    }
    setIsAdding(false);
  };

  const handleRemove = async (id: string, label: string) => {
    setRemovingId(id);
    const success = await removeType(id);
    if (success) {
      toast({ title: "Machine Type Removed", description: `"${label}" has been removed.` });
    }
    setRemovingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  if (!isLoaded) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Machine Types
        </CardTitle>
        <CardDescription>
          Customize which machine types appear as options throughout the app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current types list */}
        <div className="space-y-2">
          {machineTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <span className="text-sm font-medium">{type.label}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                disabled={removingId === type.id}
                onClick={() => handleRemove(type.id, type.label)}
              >
                {removingId === type.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
          {machineTypes.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-2">
              No machine types configured. Add one below.
            </p>
          )}
        </div>

        {/* Add new type */}
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Prize Locker"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            className="flex-1"
          />
          <Button
            onClick={handleAdd}
            disabled={!newLabel.trim() || isAdding}
            className="gap-2"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

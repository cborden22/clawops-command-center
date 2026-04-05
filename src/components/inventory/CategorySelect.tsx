import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  allCategories: string[];
  onAddCustom: (name: string) => Promise<boolean>;
  triggerClassName?: string;
  placeholder?: string;
}

export function CategorySelect({
  value,
  onValueChange,
  allCategories,
  onAddCustom,
  triggerClassName,
  placeholder = "Category",
}: CategorySelectProps) {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState("");

  const handleAddCustom = async () => {
    if (!customName.trim()) return;
    const success = await onAddCustom(customName);
    if (success) {
      onValueChange(customName.trim());
      setCustomName("");
      setIsAddingCustom(false);
    }
  };

  if (isAddingCustom) {
    return (
      <div className="flex items-center gap-1">
        <Input
          placeholder="New category..."
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") handleAddCustom();
            if (e.key === "Escape") { setIsAddingCustom(false); setCustomName(""); }
          }}
          className="h-8 text-sm"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleAddCustom}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setIsAddingCustom(false); setCustomName(""); }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v === "__add_custom__") {
          setIsAddingCustom(true);
        } else {
          onValueChange(v);
        }
      }}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allCategories.map((cat) => (
          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
        ))}
        <SelectItem value="__add_custom__">
          <span className="flex items-center gap-1 text-primary">
            <Plus className="h-3 w-3" /> Add Custom...
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

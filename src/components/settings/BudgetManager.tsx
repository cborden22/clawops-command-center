import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PiggyBank, Plus, Trash2, Save } from "lucide-react";
import { useExpenseBudgets } from "@/hooks/useExpenseBudgets";

const EXPENSE_CATEGORIES = [
  "Prizes",
  "Fuel",
  "Repairs",
  "Rent",
  "Insurance",
  "Supplies",
  "Marketing",
  "Utilities",
  "Commission",
  "Other",
];

export function BudgetManager() {
  const { budgets, upsertBudget, deleteBudget } = useExpenseBudgets();
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const handleAdd = () => {
    const cat = newCategory.trim();
    const amt = parseFloat(newAmount);
    if (!cat || isNaN(amt) || amt <= 0) return;
    upsertBudget(cat, amt);
    setNewCategory("");
    setNewAmount("");
  };

  const unusedCategories = EXPENSE_CATEGORIES.filter(
    c => !budgets.find(b => b.category.toLowerCase() === c.toLowerCase())
  );

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          Monthly Expense Budgets
        </CardTitle>
        <CardDescription>
          Set monthly budget limits per expense category. Alerts show on the dashboard when approaching limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing budgets */}
        {budgets.length > 0 && (
          <div className="space-y-2">
            {budgets.map(budget => (
              <div key={budget.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                <span className="flex-1 font-medium text-sm capitalize">{budget.category}</span>
                <Input
                  type="number"
                  className="w-28"
                  defaultValue={budget.monthlyBudget}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0 && val !== budget.monthlyBudget) {
                      upsertBudget(budget.category, val);
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">/mo</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteBudget(budget.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new budget */}
        <div className="flex items-end gap-3 pt-2 border-t border-border/50">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Category</Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="">Select category...</option>
              {unusedCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="w-28 space-y-1">
            <Label className="text-xs">Monthly $</Label>
            <Input
              type="number"
              placeholder="500"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, AlertTriangle } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { ExpenseBudget } from "@/hooks/useExpenseBudgets";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface BudgetTrackingWidgetProps {
  budgets: ExpenseBudget[];
  expenses: Array<{
    category?: string;
    amount: number;
    date: Date;
    type: string;
  }>;
}

export function BudgetTrackingWidget({ budgets, expenses }: BudgetTrackingWidgetProps) {
  const budgetProgress = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return budgets.map(budget => {
      const spent = expenses
        .filter(e => 
          e.type === "expense" && 
          e.category === budget.category &&
          e.date >= monthStart && 
          e.date <= monthEnd
        )
        .reduce((sum, e) => sum + e.amount, 0);

      const percent = budget.monthlyBudget > 0 ? (spent / budget.monthlyBudget) * 100 : 0;
      const status = percent >= 100 ? "over" : percent >= 80 ? "warning" : "ok";

      return { ...budget, spent, percent, status };
    });
  }, [budgets, expenses]);

  if (budgets.length === 0) {
    return (
      <Card className="glass-card h-full">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" />
            Expense Budgets
          </CardTitle>
          <Link to="/settings">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Set up <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground text-sm">
            Set monthly budgets per expense category in Settings
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          Expense Budgets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {budgetProgress.map(bp => (
          <div key={bp.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{bp.category}</span>
              <div className="flex items-center gap-2">
                {bp.status === "over" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                {bp.status === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                <span className="text-xs text-muted-foreground">
                  ${bp.spent.toFixed(0)} / ${bp.monthlyBudget.toFixed(0)}
                </span>
              </div>
            </div>
            <Progress 
              value={Math.min(bp.percent, 100)} 
              className={cn(
                "h-2",
                bp.status === "over" && "[&>div]:bg-destructive",
                bp.status === "warning" && "[&>div]:bg-amber-500",
              )}
            />
            {bp.status === "over" && (
              <p className="text-xs text-destructive">
                Over budget by ${(bp.spent - bp.monthlyBudget).toFixed(0)}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

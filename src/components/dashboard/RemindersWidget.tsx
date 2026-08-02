import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useReminders } from "@/hooks/useReminders";

export function RemindersWidget() {
  const navigate = useNavigate();
  const { grouped, count } = useReminders();

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            Upcoming &amp; Overdue
            {count > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {grouped.overdue.length} overdue
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="gap-1 text-xs">
            Leads
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <NotificationList limit={5} />
      </CardContent>
    </Card>
  );
}

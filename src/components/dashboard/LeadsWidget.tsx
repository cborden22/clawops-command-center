import { useLeadsDB } from '@/hooks/useLeadsDB';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, Calendar, ArrowRight, Flame, Sun, Snowflake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

export function LeadsWidget() {
  const navigate = useNavigate();
  const { leads, isLoading, getLeadStats, getLeadsWithFollowUpDue } = useLeadsDB();
  
  const stats = getLeadStats();
  const followUpsDue = getLeadsWithFollowUpDue().slice(0, 3);
  const hotLeads = leads
    .filter(l => l.priority === 'hot' && l.status !== 'won' && l.status !== 'lost')
    .slice(0, 3);

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Leads Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Leads Overview
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="gap-1 text-xs">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <p className="text-xl font-bold text-green-500">{stats.conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/10">
            <p className="text-xl font-bold text-amber-500">{stats.followUpsDue}</p>
            <p className="text-[10px] text-muted-foreground">Follow-ups</p>
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="flex items-center gap-1 text-xs">
          <Badge variant="outline" className="bg-primary/10">
            {stats.byStatus.new} New
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400">
            {stats.byStatus.contacted}
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
            {stats.byStatus.negotiating}
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="bg-green-500/10 text-green-400">
            {stats.byStatus.won} Won
          </Badge>
        </div>

        {/* Hot Leads or Follow-ups */}
        {(hotLeads.length > 0 || followUpsDue.length > 0) && (
          <div className="space-y-2">
            {hotLeads.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Flame className="h-3 w-3 text-red-500" />
                  Hot Leads
                </p>
                {hotLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => navigate('/leads')}
                    className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{lead.business_name}</p>
                    {lead.estimated_machines && (
                      <p className="text-xs text-muted-foreground">
                        {lead.estimated_machines} machine{lead.estimated_machines !== 1 ? 's' : ''}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {followUpsDue.length > 0 && hotLeads.length === 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-amber-500" />
                  Follow-ups Due
                </p>
                {followUpsDue.map((lead) => {
                  const isOverdue = lead.next_follow_up && isPast(new Date(lead.next_follow_up)) && !isToday(new Date(lead.next_follow_up));
                  return (
                    <button
                      key={lead.id}
                      onClick={() => navigate('/leads')}
                      className="w-full text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{lead.business_name}</p>
                        <span className={cn(
                          "text-xs",
                          isOverdue ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {isOverdue ? 'Overdue' : 'Today'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {leads.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No leads yet</p>
            <Button size="sm" variant="outline" onClick={() => navigate('/leads')}>
              Add Your First Lead
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

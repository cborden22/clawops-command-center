import { Lead, LeadPriority } from '@/hooks/useLeadsDB';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Phone, Calendar, Flame, Sun, Snowflake, Building2 } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isDragging?: boolean;
}

const priorityConfig: Record<LeadPriority, { icon: React.ComponentType<{ className?: string }>; label: string; className: string }> = {
  hot: { icon: Flame, label: 'Hot', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  warm: { icon: Sun, label: 'Warm', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cold: { icon: Snowflake, label: 'Cold', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

export function LeadCard({ lead, onClick, isDragging }: LeadCardProps) {
  const priority = lead.priority || 'warm';
  const PriorityIcon = priorityConfig[priority].icon;

  const getFollowUpStatus = () => {
    if (!lead.next_follow_up) return null;
    const date = new Date(lead.next_follow_up);
    
    if (isPast(date) && !isToday(date)) {
      return { label: 'Overdue', className: 'text-destructive' };
    }
    if (isToday(date)) {
      return { label: 'Today', className: 'text-amber-400' };
    }
    if (isTomorrow(date)) {
      return { label: 'Tomorrow', className: 'text-muted-foreground' };
    }
    return { label: format(date, 'MMM d'), className: 'text-muted-foreground' };
  };

  const followUpStatus = getFollowUpStatus();

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-border/50',
        'bg-card/80 backdrop-blur-sm',
        isDragging && 'opacity-50 rotate-2 scale-105 shadow-xl'
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: Name + Priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{lead.business_name}</span>
          </div>
          <Badge variant="outline" className={cn('shrink-0 text-xs', priorityConfig[priority].className)}>
            <PriorityIcon className="h-3 w-3 mr-1" />
            {priorityConfig[priority].label}
          </Badge>
        </div>

        {/* Contact Info */}
        {lead.contact_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{lead.contact_name}</span>
          </div>
        )}

        {/* Address */}
        {lead.address && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{lead.address}</span>
          </div>
        )}

        {/* Bottom Row: Machines estimate + Follow-up */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          {lead.estimated_machines && (
            <span className="text-xs text-muted-foreground">
              {lead.estimated_machines} machine{lead.estimated_machines !== 1 ? 's' : ''}
            </span>
          )}
          {!lead.estimated_machines && <span />}
          
          {followUpStatus && (
            <div className={cn('flex items-center gap-1 text-xs', followUpStatus.className)}>
              <Calendar className="h-3 w-3" />
              <span>{followUpStatus.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

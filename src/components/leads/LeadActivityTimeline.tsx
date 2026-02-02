import { useState, useEffect } from 'react';
import { LeadActivity, ActivityType, CreateActivityInput } from '@/hooks/useLeadsDB';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, Users, MapPin, FileText, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadActivityTimelineProps {
  leadId: string;
  activities: LeadActivity[];
  onAddActivity: (input: CreateActivityInput) => Promise<LeadActivity | null>;
  isLoading?: boolean;
}

const activityTypeConfig: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  call: { icon: Phone, label: 'Call', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  email: { icon: Mail, label: 'Email', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  meeting: { icon: Users, label: 'Meeting', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  site_visit: { icon: MapPin, label: 'Site Visit', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  note: { icon: FileText, label: 'Note', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export function LeadActivityTimeline({ leadId, activities, onAddActivity, isLoading }: LeadActivityTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('note');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    
    setIsSubmitting(true);
    const result = await onAddActivity({
      lead_id: leadId,
      activity_type: activityType,
      description: description.trim(),
    });
    
    if (result) {
      setDescription('');
      setActivityType('note');
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Activity Timeline</h3>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            Log Activity
          </Button>
        )}
      </div>

      {/* Add Activity Form */}
      {showForm && (
        <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
          <div className="flex gap-2">
            <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened?"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No activities logged yet
        </p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const config = activityTypeConfig[activity.activity_type];
            const Icon = config.icon;
            
            return (
              <div key={activity.id} className="flex gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border',
                  config.color
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activity.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

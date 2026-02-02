import { useState, useEffect } from 'react';
import { Lead, LeadActivity, CreateActivityInput, UpdateLeadInput } from '@/hooks/useLeadsDB';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LeadActivityTimeline } from './LeadActivityTimeline';
import { LeadForm } from './LeadForm';
import { 
  Building2, MapPin, User, Phone, Mail, Calendar, 
  Edit, Trash2, ArrowRight, Flame, Sun, Snowflake,
  DollarSign, Wrench, AlertCircle
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
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

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: LeadActivity[];
  isLoadingActivities: boolean;
  onUpdate: (id: string, data: UpdateLeadInput) => Promise<Lead | null>;
  onDelete: (id: string) => Promise<boolean>;
  onAddActivity: (input: CreateActivityInput) => Promise<LeadActivity | null>;
  onConvert: (lead: Lead) => void;
}

const priorityConfig = {
  hot: { icon: Flame, label: 'Hot', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  warm: { icon: Sun, label: 'Warm', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cold: { icon: Snowflake, label: 'Cold', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

const statusConfig = {
  new: { label: 'New', className: 'bg-primary/20 text-primary' },
  contacted: { label: 'Contacted', className: 'bg-blue-500/20 text-blue-400' },
  negotiating: { label: 'Negotiating', className: 'bg-purple-500/20 text-purple-400' },
  won: { label: 'Won', className: 'bg-green-500/20 text-green-400' },
  lost: { label: 'Lost', className: 'bg-destructive/20 text-destructive' },
};

export function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
  activities,
  isLoadingActivities,
  onUpdate,
  onDelete,
  onAddActivity,
  onConvert,
}: LeadDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset edit mode when dialog closes or lead changes
  useEffect(() => {
    if (!open) setIsEditing(false);
  }, [open, lead?.id]);

  if (!lead) return null;

  const priority = lead.priority || 'warm';
  const PriorityIcon = priorityConfig[priority].icon;

  const handleUpdate = async (data: any) => {
    setIsSubmitting(true);
    const result = await onUpdate(lead.id, data);
    if (result) {
      setIsEditing(false);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    const success = await onDelete(lead.id);
    if (success) {
      onOpenChange(false);
    }
    setShowDeleteConfirm(false);
  };

  const getFollowUpStatus = () => {
    if (!lead.next_follow_up) return null;
    const date = new Date(lead.next_follow_up);
    
    if (isPast(date) && !isToday(date)) {
      return { text: `Overdue: ${format(date, 'MMM d')}`, isOverdue: true };
    }
    if (isToday(date)) {
      return { text: 'Today', isOverdue: false };
    }
    return { text: format(date, 'MMM d, yyyy'), isOverdue: false };
  };

  const followUpStatus = getFollowUpStatus();
  const isConverted = lead.status === 'won' && lead.converted_location_id;
  const canConvert = lead.status !== 'lost' && !lead.converted_location_id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl">{lead.business_name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={statusConfig[lead.status].className}>
                      {statusConfig[lead.status].label}
                    </Badge>
                    <Badge variant="outline" className={priorityConfig[priority].className}>
                      <PriorityIcon className="h-3 w-3 mr-1" />
                      {priorityConfig[priority].label}
                    </Badge>
                    {isConverted && (
                      <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                        Converted
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {!isEditing && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {isEditing ? (
            <LeadForm
              lead={lead}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="space-y-6 mt-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.address}</span>
                  </div>
                )}
                {lead.contact_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.contact_name}</span>
                  </div>
                )}
                {lead.contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${lead.contact_phone}`} className="hover:underline">
                      {lead.contact_phone}
                    </a>
                  </div>
                )}
                {lead.contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${lead.contact_email}`} className="hover:underline">
                      {lead.contact_email}
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              {/* Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {lead.estimated_machines && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Wrench className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold">{lead.estimated_machines}</p>
                    <p className="text-xs text-muted-foreground">Est. Machines</p>
                  </div>
                )}
                {lead.estimated_revenue && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold">${lead.estimated_revenue}</p>
                    <p className="text-xs text-muted-foreground">Est. Revenue/mo</p>
                  </div>
                )}
                {lead.source && (
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">{lead.source}</p>
                    <p className="text-xs text-muted-foreground">Source</p>
                  </div>
                )}
                {followUpStatus && (
                  <div className={cn(
                    "text-center p-3 rounded-lg",
                    followUpStatus.isOverdue ? "bg-destructive/10" : "bg-muted/50"
                  )}>
                    {followUpStatus.isOverdue ? (
                      <AlertCircle className="h-4 w-4 mx-auto text-destructive mb-1" />
                    ) : (
                      <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    )}
                    <p className={cn(
                      "text-sm font-medium",
                      followUpStatus.isOverdue && "text-destructive"
                    )}>
                      {followUpStatus.text}
                    </p>
                    <p className="text-xs text-muted-foreground">Follow-up</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {lead.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Activity Timeline */}
              <LeadActivityTimeline
                leadId={lead.id}
                activities={activities}
                onAddActivity={onAddActivity}
                isLoading={isLoadingActivities}
              />

              {/* Convert Button */}
              {canConvert && (
                <>
                  <Separator />
                  <Button
                    onClick={() => onConvert(lead)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    Convert to Location
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lead.business_name}"? This action cannot be undone.
              All activity history will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

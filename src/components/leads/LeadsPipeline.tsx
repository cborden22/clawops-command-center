import { useState } from 'react';
import { Lead, LeadStatus } from '@/hooks/useLeadsDB';
import { LeadCard } from './LeadCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, Phone, HandshakeIcon, Trophy, XCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LeadsPipelineProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

const statusColumns: { status: LeadStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { status: 'new', label: 'New', icon: Sparkles, color: 'bg-primary/20 text-primary border-primary/30' },
  { status: 'contacted', label: 'Contacted', icon: Phone, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { status: 'negotiating', label: 'Negotiating', icon: HandshakeIcon, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { status: 'won', label: 'Won', icon: Trophy, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { status: 'lost', label: 'Lost', icon: XCircle, color: 'bg-destructive/20 text-destructive border-destructive/30' },
];

export function LeadsPipeline({ leads, onLeadClick, onStatusChange }: LeadsPipelineProps) {
  const isMobile = useIsMobile();
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);
  const [activeStatus, setActiveStatus] = useState<LeadStatus>('new');

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead.id);
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    
    if (draggedLead && draggedLead.status !== status) {
      onStatusChange(draggedLead.id, status);
    }
    setDraggedLead(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStatus(null);
  };

  const getLeadsForStatus = (status: LeadStatus) => {
    return leads.filter(l => l.status === status);
  };

  // Mobile view with tab-based layout
  if (isMobile) {
    const activeLeads = getLeadsForStatus(activeStatus);
    const activeColumn = statusColumns.find(c => c.status === activeStatus);
    const ActiveIcon = activeColumn?.icon || Sparkles;

    return (
      <div className="space-y-4">
        {/* Horizontal scrollable status tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {statusColumns.map(({ status, label, icon: Icon, color }) => {
            const count = getLeadsForStatus(status).length;
            const isActive = activeStatus === status;

            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className={cn(
                    "text-xs h-5 px-1.5 min-w-[20px] justify-center",
                    isActive && "bg-primary-foreground/20 text-primary-foreground border-0"
                  )}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Cards for active status */}
        <div className="space-y-3">
          {activeLeads.length === 0 ? (
            <div className="py-12 text-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
              <ActiveIcon className={cn("h-8 w-8 mx-auto mb-2", activeColumn?.color)} />
              <p className="text-sm text-muted-foreground">
                No {activeColumn?.label.toLowerCase()} leads
              </p>
            </div>
          ) : (
            activeLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // Desktop view with kanban columns
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      {statusColumns.map(({ status, label, icon: Icon, color }) => {
        const columnLeads = getLeadsForStatus(status);
        const isDragOver = dragOverStatus === status;

        return (
          <div
            key={status}
            className={cn(
              'flex-shrink-0 w-[280px] md:w-[260px] lg:flex-1 lg:min-w-[200px] lg:max-w-[320px]',
              'rounded-xl border border-border/50 bg-muted/30 transition-all duration-200',
              isDragOver && 'border-primary/50 bg-primary/5'
            )}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded-md', color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">{label}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {columnLeads.length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
              <div className="p-2 space-y-2">
                {columnLeads.length === 0 ? (
                  <div className={cn(
                    'py-8 text-center text-sm text-muted-foreground rounded-lg border-2 border-dashed border-border/30',
                    isDragOver && 'border-primary/30 bg-primary/5'
                  )}>
                    {isDragOver ? 'Drop here' : 'No leads'}
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                    >
                      <LeadCard
                        lead={lead}
                        onClick={() => onLeadClick(lead)}
                        isDragging={draggedLead?.id === lead.id}
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

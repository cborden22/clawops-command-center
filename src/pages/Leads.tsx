import { useState, useEffect, useMemo } from 'react';
import { useLeadsDB, Lead, LeadActivity, LeadStatus, LeadPriority, CreateLeadInput } from '@/hooks/useLeadsDB';
import { LeadsPipeline } from '@/components/leads/LeadsPipeline';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadForm } from '@/components/leads/LeadForm';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { LeadDetailDialog } from '@/components/leads/LeadDetailDialog';
import { ConvertToLocationDialog } from '@/components/leads/ConvertToLocationDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, LayoutGrid, List, Users, TrendingUp, Calendar, Flame } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Leads() {
  const isMobile = useIsMobile();
  const {
    leads,
    isLoading,
    fetchLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    fetchActivities,
    createActivity,
    getLeadStats,
  } = useLeadsDB();

  // View state
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected lead state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<LeadActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Convert dialog state
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Get unique sources for filter dropdown
  const sources = useMemo(() => {
    const uniqueSources = new Set(leads.map(l => l.source).filter(Boolean) as string[]);
    return Array.from(uniqueSources).sort();
  }, [leads]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          lead.business_name.toLowerCase().includes(query) ||
          lead.contact_name?.toLowerCase().includes(query) ||
          lead.address?.toLowerCase().includes(query) ||
          lead.contact_email?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false;

      // Source filter
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;

      return true;
    });
  }, [leads, searchQuery, priorityFilter, sourceFilter]);

  // Stats
  const stats = getLeadStats();

  // Handle lead click - fetch activities and show detail
  const handleLeadClick = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailDialog(true);
    setIsLoadingActivities(true);
    const activities = await fetchActivities(lead.id);
    setSelectedActivities(activities);
    setIsLoadingActivities(false);
  };

  // Handle add lead
  const handleAddLead = async (data: CreateLeadInput) => {
    setIsSubmitting(true);
    const result = await createLead(data);
    if (result) {
      setShowAddDialog(false);
    }
    setIsSubmitting(false);
  };

  // Handle status change (drag & drop)
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    await updateLeadStatus(leadId, newStatus);
  };

  // Handle convert
  const handleConvert = (lead: Lead) => {
    setLeadToConvert(lead);
    setShowConvertDialog(true);
    setShowDetailDialog(false);
  };

  const handleConvertSuccess = async (leadId: string, locationId: string) => {
    await fetchLeads(); // Refresh leads to get updated status
  };

  // Refresh activities when they change
  const handleAddActivity = async (input: any) => {
    const result = await createActivity(input);
    if (result) {
      setSelectedActivities(prev => [result, ...prev]);
    }
    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and manage your potential locations
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.followUpsDue}</p>
                <p className="text-xs text-muted-foreground">Follow-ups Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Flame className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {leads.filter(l => l.priority === 'hot' && l.status !== 'won' && l.status !== 'lost').length}
                </p>
                <p className="text-xs text-muted-foreground">Hot Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <LeadFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          sourceFilter={sourceFilter}
          onSourceChange={setSourceFilter}
          sources={sources}
        />
        
        {!isMobile && (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'pipeline' | 'list')}>
            <TabsList>
              <TabsTrigger value="pipeline" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : viewMode === 'pipeline' || isMobile ? (
        <LeadsPipeline
          leads={filteredLeads}
          onLeadClick={handleLeadClick}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => handleLeadClick(lead)} />
          ))}
          {filteredLeads.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No leads found
            </div>
          )}
        </div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <LeadForm
            onSubmit={handleAddLead}
            onCancel={() => setShowAddDialog(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        lead={selectedLead}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        activities={selectedActivities}
        isLoadingActivities={isLoadingActivities}
        onUpdate={updateLead}
        onDelete={deleteLead}
        onAddActivity={handleAddActivity}
        onConvert={handleConvert}
      />

      {/* Convert to Location Dialog */}
      <ConvertToLocationDialog
        lead={leadToConvert}
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        onSuccess={handleConvertSuccess}
      />
    </div>
  );
}

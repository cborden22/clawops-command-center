import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'won' | 'lost';
export type LeadPriority = 'hot' | 'warm' | 'cold';
export type ActivityType = 'call' | 'email' | 'meeting' | 'site_visit' | 'note';

export interface Lead {
  id: string;
  user_id: string;
  business_name: string;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: LeadStatus;
  priority: LeadPriority | null;
  estimated_machines: number | null;
  estimated_revenue: number | null;
  source: string | null;
  next_follow_up: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  converted_location_id: string | null;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
}

export interface CreateLeadInput {
  business_name: string;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  estimated_machines?: number;
  estimated_revenue?: number;
  source?: string;
  next_follow_up?: string;
  notes?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  converted_location_id?: string;
}

export interface CreateActivityInput {
  lead_id: string;
  activity_type: ActivityType;
  description: string;
}

export function useLeadsDB() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data as Lead[]) || []);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (input: CreateLeadInput): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...input,
          user_id: user.id,
          status: input.status || 'new',
          priority: input.priority || 'warm',
        })
        .select()
        .single();

      if (error) throw error;
      
      const newLead = data as Lead;
      setLeads(prev => [newLead, ...prev]);
      
      toast({
        title: 'Lead Created',
        description: `${input.business_name} has been added to your pipeline`,
      });
      
      return newLead;
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lead',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateLead = async (id: string, input: UpdateLeadInput): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('leads')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedLead = data as Lead;
      setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
      
      return updatedLead;
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus): Promise<boolean> => {
    const result = await updateLead(id, { status });
    if (result) {
      toast({
        title: 'Status Updated',
        description: `Lead moved to ${status}`,
      });
    }
    return !!result;
  };

  const deleteLead = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setLeads(prev => prev.filter(l => l.id !== id));
      
      toast({
        title: 'Lead Deleted',
        description: 'The lead has been removed',
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Activity functions
  const fetchActivities = async (leadId: string): Promise<LeadActivity[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as LeadActivity[]) || [];
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      return [];
    }
  };

  const createActivity = async (input: CreateActivityInput): Promise<LeadActivity | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Activity Logged',
        description: 'Activity has been added to the timeline',
      });
      
      return data as LeadActivity;
    } catch (error: any) {
      console.error('Error creating activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to log activity',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Helper functions
  const getLeadsByStatus = (status: LeadStatus): Lead[] => {
    return leads.filter(l => l.status === status);
  };

  const getLeadsWithFollowUpDue = (): Lead[] => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return leads.filter(l => {
      if (!l.next_follow_up || l.status === 'won' || l.status === 'lost') return false;
      return new Date(l.next_follow_up) <= today;
    });
  };

  const getLeadStats = () => {
    const total = leads.length;
    const byStatus = {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      negotiating: leads.filter(l => l.status === 'negotiating').length,
      won: leads.filter(l => l.status === 'won').length,
      lost: leads.filter(l => l.status === 'lost').length,
    };
    const followUpsDue = getLeadsWithFollowUpDue().length;
    const conversionRate = byStatus.won + byStatus.lost > 0
      ? Math.round((byStatus.won / (byStatus.won + byStatus.lost)) * 100)
      : 0;

    return { total, byStatus, followUpsDue, conversionRate };
  };

  return {
    leads,
    isLoading,
    fetchLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    fetchActivities,
    createActivity,
    getLeadsByStatus,
    getLeadsWithFollowUpDue,
    getLeadStats,
  };
}

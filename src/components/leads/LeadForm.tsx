import { useState } from 'react';
import { Lead, CreateLeadInput, LeadStatus, LeadPriority } from '@/hooks/useLeadsDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: CreateLeadInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const priorityOptions: { value: LeadPriority; label: string }[] = [
  { value: 'hot', label: '🔥 Hot' },
  { value: 'warm', label: '☀️ Warm' },
  { value: 'cold', label: '❄️ Cold' },
];

const sourceOptions = [
  'Referral',
  'Cold Call',
  'Website',
  'Trade Show',
  'Social Media',
  'Walk-in',
  'Other',
];

export function LeadForm({ lead, onSubmit, onCancel, isSubmitting }: LeadFormProps) {
  const [formData, setFormData] = useState<CreateLeadInput>({
    business_name: lead?.business_name || '',
    address: lead?.address || '',
    contact_name: lead?.contact_name || '',
    contact_phone: lead?.contact_phone || '',
    contact_email: lead?.contact_email || '',
    status: lead?.status || 'new',
    priority: lead?.priority || 'warm',
    estimated_machines: lead?.estimated_machines || undefined,
    estimated_revenue: lead?.estimated_revenue || undefined,
    source: lead?.source || '',
    next_follow_up: lead?.next_follow_up || undefined,
    notes: lead?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const updateField = <K extends keyof CreateLeadInput>(field: K, value: CreateLeadInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Business Name - Required */}
      <div className="space-y-2">
        <Label htmlFor="business_name">Business Name *</Label>
        <Input
          id="business_name"
          value={formData.business_name}
          onChange={(e) => updateField('business_name', e.target.value)}
          placeholder="Joe's Arcade"
          required
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="123 Main St, City, State"
        />
      </div>

      {/* Contact Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact Name</Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => updateField('contact_name', e.target.value)}
            placeholder="John Smith"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Phone</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => updateField('contact_phone', e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_email">Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => updateField('contact_email', e.target.value)}
            placeholder="john@example.com"
          />
        </div>
      </div>

      {/* Status & Priority Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => updateField('status', value as LeadStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => updateField('priority', value as LeadPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estimates Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_machines">Estimated Machines</Label>
          <Input
            id="estimated_machines"
            type="number"
            min="0"
            value={formData.estimated_machines ?? ''}
            onChange={(e) => updateField('estimated_machines', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_revenue">Est. Monthly Revenue ($)</Label>
          <Input
            id="estimated_revenue"
            type="number"
            min="0"
            step="0.01"
            value={formData.estimated_revenue ?? ''}
            onChange={(e) => updateField('estimated_revenue', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="450.00"
          />
        </div>
      </div>

      {/* Source & Follow-up Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lead Source</Label>
          <Select
            value={formData.source || ''}
            onValueChange={(value) => updateField('source', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="How did you find this lead?" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Next Follow-up</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.next_follow_up && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.next_follow_up
                  ? format(new Date(formData.next_follow_up), 'PPP')
                  : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.next_follow_up ? new Date(formData.next_follow_up) : undefined}
                onSelect={(date) => updateField('next_follow_up', date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Any additional notes about this lead..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.business_name.trim()}>
          {isSubmitting ? 'Saving...' : lead ? 'Update Lead' : 'Add Lead'}
        </Button>
      </div>
    </form>
  );
}

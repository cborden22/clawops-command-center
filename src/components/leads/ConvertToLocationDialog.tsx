import { useState } from 'react';
import { Lead } from '@/hooks/useLeadsDB';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Building2, MapPin, User, Phone, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/utils/slugify';

interface ConvertToLocationDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (leadId: string, locationId: string) => void;
}

export function ConvertToLocationDialog({ lead, open, onOpenChange, onSuccess }: ConvertToLocationDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Populate form when lead changes
  const resetForm = () => {
    if (lead) {
      setFormData({
        name: lead.business_name,
        address: lead.address || '',
        contact_person: lead.contact_name || '',
        contact_phone: lead.contact_phone || '',
        contact_email: lead.contact_email || '',
        notes: lead.notes || '',
      });
    }
    setIsSuccess(false);
  };

  // Reset when dialog opens
  useState(() => {
    if (open && lead) {
      resetForm();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !lead) return;

    setIsSubmitting(true);

    try {
      // Create the location
      const slug = slugify(formData.name);
      const { data: newLocation, error: locationError } = await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          name: formData.name,
          address: formData.address || null,
          contact_person: formData.contact_person || null,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          notes: formData.notes || null,
          slug,
          is_active: true,
        })
        .select()
        .single();

      if (locationError) throw locationError;

      // Update lead status to won and link to location
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'won',
          converted_location_id: newLocation.id,
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      setIsSuccess(true);
      onSuccess(lead.id, newLocation.id);

      toast({
        title: 'Location Created!',
        description: `${formData.name} has been added to your locations.`,
      });

      // Brief delay to show success state
      setTimeout(() => {
        onOpenChange(false);
        navigate(`/locations`);
      }, 1500);

    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to create location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Convert Lead to Location
          </DialogTitle>
          <DialogDescription>
            Create a new location from this lead. You can adjust the details before creating.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Location Created!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Redirecting to locations page...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Location Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Location Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Person
                </Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Location
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Download, Upload, Search } from 'lucide-react';
import { StateRegulation } from '@/types/compliance';
import { useToast } from '@/hooks/use-toast';

interface DataManagementProps {
  onDataUpdate?: (data: StateRegulation[]) => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onDataUpdate }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [newStateData, setNewStateData] = useState<Partial<StateRegulation>>({
    state: '',
    abbr: '',
    status: 'Ambiguous',
    classification: 'Mixed',
    prize_caps: { per_prize_usd: 0, notes: '' },
    licensing: {
      required: false,
      permit_type: '',
      who_licenses: '',
      fees_usd: [0],
      renewal: '',
      processing_time_days: 0
    },
    tax_finance: {
      amusement_tax: '',
      sales_tax_on_plays: false,
      distributor_reg: false
    },
    operational_rules: {
      age_limits: '',
      signage_required: [],
      payout_rules: '',
      inspection: '',
      machine_marking: ''
    },
    local_overrides: [],
    red_flags: [],
    sources: [],
    disclaimer: 'Not legal advice. Verify with local authorities.'
  });

  const saveNewState = () => {
    if (!newStateData.state || !newStateData.abbr) {
      toast({
        title: "Validation Error",
        description: "State name and abbreviation are required",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically save to a database or update the data source
    toast({
      title: "State Added",
      description: `${newStateData.state} data has been saved`,
    });
    
    setIsAddingNew(false);
    setNewStateData({
      state: '',
      abbr: '',
      status: 'Ambiguous',
      classification: 'Mixed',
      prize_caps: { per_prize_usd: 0, notes: '' },
      licensing: {
        required: false,
        permit_type: '',
        who_licenses: '',
        fees_usd: [0],
        renewal: '',
        processing_time_days: 0
      },
      tax_finance: {
        amusement_tax: '',
        sales_tax_on_plays: false,
        distributor_reg: false
      },
      operational_rules: {
        age_limits: '',
        signage_required: [],
        payout_rules: '',
        inspection: '',
        machine_marking: ''
      },
      local_overrides: [],
      red_flags: [],
      sources: [],
      disclaimer: 'Not legal advice. Verify with local authorities.'
    });
  };

  const exportData = () => {
    // Create a template for researchers
    const template = {
      instructions: "Use this template to research and add new state data",
      schema_version: "1.0.0",
      research_guidelines: [
        "Verify all information with official state sources",
        "Include specific statute citations",
        "Note any recent law changes",
        "Flag conflicting interpretations"
      ],
      template: newStateData
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compliance-data-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Research template has been downloaded",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Data Management Tools
            <div className="flex gap-2">
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Template
              </Button>
              <Button onClick={() => setIsAddingNew(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add State
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-blue-600">States with Data</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">45</div>
              <div className="text-sm text-yellow-600">Need Research</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">90%</div>
              <div className="text-sm text-green-600">Accuracy Target</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle>Add New State Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">State Name</label>
                <Input
                  value={newStateData.state}
                  onChange={(e) => setNewStateData({...newStateData, state: e.target.value})}
                  placeholder="e.g., Colorado"
                />
              </div>
              <div>
                <label className="text-sm font-medium">State Abbreviation</label>
                <Input
                  value={newStateData.abbr}
                  onChange={(e) => setNewStateData({...newStateData, abbr: e.target.value.toUpperCase()})}
                  placeholder="e.g., CO"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={newStateData.status} 
                  onValueChange={(value: any) => setNewStateData({...newStateData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Allowed">Allowed</SelectItem>
                    <SelectItem value="Regulated">Regulated</SelectItem>
                    <SelectItem value="Restricted">Restricted</SelectItem>
                    <SelectItem value="Prohibited">Prohibited</SelectItem>
                    <SelectItem value="Ambiguous">Ambiguous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Prize Cap ($)</label>
                <NumberInput
                  value={newStateData.prize_caps?.per_prize_usd}
                  onChange={(e) => setNewStateData({
                    ...newStateData, 
                    prize_caps: {...newStateData.prize_caps!, per_prize_usd: Number(e.target.value)}
                  })}
                  placeholder="25"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Research Notes</label>
              <Textarea
                value={newStateData.prize_caps?.notes}
                onChange={(e) => setNewStateData({
                  ...newStateData,
                  prize_caps: {...newStateData.prize_caps!, notes: e.target.value}
                })}
                placeholder="Add research findings, statute references, etc."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveNewState}>
                <Save className="h-4 w-4 mr-2" />
                Save State Data
              </Button>
              <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Research Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Primary Sources</h4>
              <ul className="text-sm text-blue-700 mt-1">
                <li>• State revenue/gaming departments</li>
                <li>• Official state statutes and codes</li>
                <li>• Published regulatory guidance</li>
              </ul>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800">Verification Required</h4>
              <ul className="text-sm text-yellow-700 mt-1">
                <li>• Cross-reference multiple sources</li>
                <li>• Check for recent law changes</li>
                <li>• Verify local ordinance variations</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">Quality Standards</h4>
              <ul className="text-sm text-green-700 mt-1">
                <li>• Include specific citations</li>
                <li>• Note confidence level</li>
                <li>• Document research date</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

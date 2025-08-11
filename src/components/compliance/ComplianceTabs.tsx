
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceLookup } from './ComplianceLookup';
import { ResearchTracker } from './ResearchTracker';
import { DataManagement } from './DataManagement';
import { Search, BarChart3, Settings } from 'lucide-react';

export const ComplianceTabs = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Law & Compliance Suite
        </h1>
        <p className="text-muted-foreground">
          Comprehensive compliance research and lookup tools for claw machine operations
        </p>
      </div>

      <Tabs defaultValue="lookup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lookup" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Compliance Lookup
          </TabsTrigger>
          <TabsTrigger value="research" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Research Tracker
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Data Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lookup">
          <ComplianceLookup />
        </TabsContent>

        <TabsContent value="research">
          <ResearchTracker />
        </TabsContent>

        <TabsContent value="management">
          <DataManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

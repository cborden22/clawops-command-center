
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { researchTracker, researchPriorities } from '@/data/complianceResearch';

export const ResearchTracker = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'needs_research': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'conflicting': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const completedStates = researchTracker.filter(s => s.research_status === 'complete').length;
  const totalStates = 50; // All US states
  const progressPercentage = (completedStates / totalStates) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Research Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>States Researched</span>
                <span>{completedStates} of {totalStates}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {researchTracker.filter(s => s.research_status === 'complete').length}
                </div>
                <div className="text-sm text-green-600">Complete</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {researchTracker.filter(s => s.research_status === 'partial').length}
                </div>
                <div className="text-sm text-yellow-600">Partial</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {researchTracker.filter(s => s.research_status === 'needs_research').length}
                </div>
                <div className="text-sm text-red-600">Needed</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {researchTracker.filter(s => s.research_status === 'conflicting').length}
                </div>
                <div className="text-sm text-orange-600">Conflicting</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Research Status by State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {researchTracker.map(state => (
                <div key={state.abbr} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(state.research_status)}
                    <div>
                      <div className="font-medium">{state.state}</div>
                      <div className="text-xs text-muted-foreground">
                        Updated: {state.last_updated}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getConfidenceColor(state.confidence_level)} text-white text-xs`}>
                      {state.confidence_level}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {state.sources_verified} sources
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Research Priorities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {researchPriorities.map((item, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.state}</span>
                    <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                      {item.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

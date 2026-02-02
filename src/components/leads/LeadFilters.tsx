import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { LeadPriority } from '@/hooks/useLeadsDB';

interface LeadFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priorityFilter: LeadPriority | 'all';
  onPriorityChange: (priority: LeadPriority | 'all') => void;
  sourceFilter: string;
  onSourceChange: (source: string) => void;
  sources: string[];
}

export function LeadFilters({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  sourceFilter,
  onSourceChange,
  sources,
}: LeadFiltersProps) {
  const hasFilters = searchQuery || priorityFilter !== 'all' || sourceFilter !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onPriorityChange('all');
    onSourceChange('all');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search leads..."
          className="pl-9"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Priority Filter */}
      <Select value={priorityFilter} onValueChange={(v) => onPriorityChange(v as LeadPriority | 'all')}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="hot">🔥 Hot</SelectItem>
          <SelectItem value="warm">☀️ Warm</SelectItem>
          <SelectItem value="cold">❄️ Cold</SelectItem>
        </SelectContent>
      </Select>

      {/* Source Filter */}
      <Select value={sourceFilter} onValueChange={onSourceChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {sources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

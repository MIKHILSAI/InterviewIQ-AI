import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface FiltersBarProps {
  search: string;
  type: string;
  status: string;
  sort: string;
  onSearchChange: (val: string) => void;
  onTypeChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onSortChange: (val: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FiltersBar({
  search,
  type,
  status,
  sort,
  onSearchChange,
  onTypeChange,
  onStatusChange,
  onSortChange,
  onReset,
  hasActiveFilters,
}: FiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by domain (e.g. Python, SQL)..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 rounded-xl"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Type Filter */}
      <div className="w-full sm:w-36">
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-36">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Filter */}
      <div className="w-full sm:w-40">
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Score</SelectItem>
            <SelectItem value="lowest">Lowest Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
}

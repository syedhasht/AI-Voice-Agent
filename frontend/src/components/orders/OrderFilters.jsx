import { Search, Filter, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../common';
import { STATUS_LABELS } from '../../utils/constants';

export default function OrderFilters({ search, onSearchChange, statusFilter, onStatusChange, sortField, onSortChange, sortDirection, onSortDirectionChange }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, phone, medicine..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <Button
          variant="secondary"
          icon={Filter}
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'border-primary text-primary' : ''}
        >
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-surface-secondary rounded-xl border border-border">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-tertiary">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Call</option>
              <option value="in_progress">In Call</option>
              <option value="confirmed">Confirmed</option>
              <option value="modified">Modified</option>
              <option value="rejected">Rejected</option>
              <option value="need_human">Need Human</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-tertiary">Sort By</label>
            <select
              value={sortField}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="createdAt">Date Created</option>
              <option value="customer">Customer Name</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-tertiary">Direction</label>
            <select
              value={sortDirection}
              onChange={(e) => onSortDirectionChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { OrderTable, OrderFilters } from '../components/orders';
import { Button } from '../components/common';
import { PageTransition } from '../components/layout';
import { fetchOrders } from '../services';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ITEMS_PER_PAGE } from '../utils/constants';
import { classNames } from '../utils/helpers';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);

  const load = useCallback((showSkeleton = false) => {
    if (showSkeleton) {
      setLoading(true);
    }
    setError(null);
    fetchOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => {
        if (showSkeleton) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 3000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = useMemo(() => {
    let result = [...orders];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.displayId.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          o.medicine.toLowerCase().includes(q) ||
          o.phone.includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp;
      if (sortField === 'customer') {
        cmp = a.customer.localeCompare(b.customer);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else {
        cmp = new Date(a.createdAt) - new Date(b.createdAt);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [orders, search, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortField, sortDirection]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
            <p className="text-sm text-text-secondary mt-1">Manage and monitor medication orders</p>
          </div>
          <Button icon={PlusCircle} onClick={() => navigate('/create-order')}>
            New Order
          </Button>
        </div>

        <OrderFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sortField={sortField}
          onSortChange={setSortField}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
        />

        {loading ? (
          <div className="card overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex gap-4 py-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="skeleton-pulse h-4 flex-1 rounded" />
                ))}
              </div>
              {Array.from({ length: 6 }).map((_, r) => (
                <div key={r} className="flex gap-4 py-3 border-b border-border last:border-0">
                  <div className="skeleton-pulse h-4 w-16 rounded" />
                  <div className="skeleton-pulse h-4 w-28 rounded" />
                  <div className="skeleton-pulse h-4 w-28 rounded" />
                  <div className="skeleton-pulse h-4 w-36 rounded flex-1" />
                  <div className="skeleton-pulse h-4 w-10 rounded" />
                  <div className="skeleton-pulse h-4 w-28 rounded" />
                  <div className="skeleton-pulse h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-accent/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Failed to load orders</h3>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <Button variant="primary" onClick={load}>Retry</Button>
          </div>
        ) : (
          <>
            <OrderTable orders={paginated} onRefresh={load} />

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-text-secondary">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} orders
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={classNames(
                      'p-2 rounded-lg border border-border transition-colors',
                      page === 1 ? 'text-text-tertiary cursor-not-allowed' : 'text-text-secondary hover:bg-surface-tertiary'
                    )}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={classNames(
                        'min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors',
                        page === i + 1
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-surface-tertiary'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={classNames(
                      'p-2 rounded-lg border border-border transition-colors',
                      page === totalPages ? 'text-text-tertiary cursor-not-allowed' : 'text-text-secondary hover:bg-surface-tertiary'
                    )}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}

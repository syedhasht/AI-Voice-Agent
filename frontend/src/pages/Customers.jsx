import { useState, useEffect, useCallback } from 'react';
import { PageTransition } from '../components/layout';
import { Card, Button, HighlightText, Badge } from '../components/common';
import { fetchCustomers, fetchCustomerById } from '../services';
import { Users, Search, MapPin, ChevronLeft, ChevronRight, X, Loader, Mail, FileText, Phone, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import { motion } from 'framer-motion';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);

  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers({
        page,
        limit,
        search: search.trim() || undefined,
        city: cityFilter === 'all' ? undefined : cityFilter
      });
      setCustomers(data.items || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      console.error("Customers load error:", err);
      setError("Failed to fetch customers.");
    } finally {
      setLoading(false);
    }
  }, [page, search, cityFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilterChange = (field, val) => {
    if (field === 'search') setSearch(val);
    if (field === 'city') setCityFilter(val);
    setPage(1);
  };

  const handleRowClick = async (customerId) => {
    setFetchingCustomer(true);
    try {
      const data = await fetchCustomerById(customerId);
      setSelectedCustomer(data);
    } catch (err) {
      console.error("Failed to load customer details", err);
    } finally {
      setFetchingCustomer(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <PageTransition>
      <div className="space-y-6 pb-12 relative text-left">
        {/* Loader Overlay for Customer details */}
        {fetchingCustomer && (
          <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 p-6 rounded-2xl shadow-xl">
              <Loader className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-text-secondary">Retrieving customer profile...</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Users className="text-primary" />
              <span>Customers Directory</span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Registered customers database ({total.toLocaleString()} total profiles)
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-border">
          <div className="relative w-full md:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by code, name, phone, email, address..."
              value={search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface-secondary text-text-primary placeholder:text-text-tertiary border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm font-medium text-text-secondary whitespace-nowrap">City:</span>
            <select
              value={cityFilter}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full md:w-48 px-3 py-2 text-sm bg-surface-secondary text-text-primary border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">All Cities</option>
              <option value="Springfield">Springfield</option>
              <option value="Fakeville">Fakeville</option>
              <option value="Test City">Test City</option>
              <option value="Sample Town">Sample Town</option>
              <option value="Demo City">Demo City</option>
            </select>
          </div>
        </Card>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
            {error}
          </div>
        )}

        {/* Data List */}
        <Card className="p-0 overflow-hidden border border-border">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Loading customers...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-secondary font-medium bg-surface-secondary/50">
                      <th className="py-3 px-6">Customer Code</th>
                      <th className="py-3 px-6">Full Name</th>
                      <th className="py-3 px-6">Phone Number</th>
                      <th className="py-3 px-6">Email</th>
                      <th className="py-3 px-6">City / Province</th>
                      <th className="py-3 px-6">Address</th>
                      <th className="py-3 px-6 text-center">Age / Gender</th>
                      <th className="py-3 px-6 text-right font-normal">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customers.map((c) => (
                      <tr 
                        key={c.id} 
                        onClick={() => handleRowClick(c.id)}
                        className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-6 font-semibold text-text-primary">
                          <HighlightText text={c.customer_code} search={search} />
                        </td>
                        <td className="py-3.5 px-6 font-medium text-text-primary">
                          <HighlightText text={c.full_name} search={search} />
                        </td>
                        <td className="py-3.5 px-6 text-text-secondary">
                          <HighlightText text={c.phone_number} search={search} />
                        </td>
                        <td className="py-3.5 px-6 text-text-secondary truncate max-w-[150px]" title={c.email}>
                          <HighlightText text={c.email} search={search} />
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                            <MapPin size={13} className="text-primary" />
                            <span>
                              <HighlightText text={c.city} search={search} />, <HighlightText text={c.province} search={search} />
                            </span>
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-text-secondary max-w-[200px] truncate" title={c.address}>
                          <HighlightText text={c.address || 'N/A'} search={search} />
                        </td>
                        <td className="py-3.5 px-6 text-center text-text-secondary">
                          <span className="text-xs bg-surface-secondary text-text-primary px-2.5 py-1 rounded-full font-semibold border border-border whitespace-nowrap">
                            <HighlightText text={String(c.age)} search={search} /> yrs / <HighlightText text={c.gender} search={search} />
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right text-xs text-text-secondary">{formatDate(c.created_at)}</td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-text-secondary text-sm">
                          No customers found matching the search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-secondary/20">
                <span className="text-xs text-text-secondary font-medium">
                  Showing <span className="text-text-primary font-semibold">{((page - 1) * limit) + 1}</span> to{' '}
                  <span className="text-text-primary font-semibold">
                    {Math.min(page * limit, total)}
                  </span>{' '}
                  of <span className="text-text-primary font-semibold">{total.toLocaleString()}</span> customers
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-1 px-2.5 flex items-center gap-1 text-xs"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </Button>
                  <span className="text-xs text-text-primary font-semibold px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-1 px-2.5 flex items-center gap-1 text-xs"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Customer Details Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-3xl bg-white border border-border rounded-3xl p-6 overflow-hidden max-h-[85vh] flex flex-col space-y-5 shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-border pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                    {selectedCustomer.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{selectedCustomer.full_name}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Code: {selectedCustomer.customer_code} | Age: {selectedCustomer.age} | Gender: {selectedCustomer.gender}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-text-secondary hover:text-text-primary p-1.5 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1.5 custom-scrollbar">
                {/* Profile Grid Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-secondary p-4 rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-text-secondary shrink-0">
                      <Phone size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">Phone</span>
                      <p className="text-sm font-semibold text-text-primary">{selectedCustomer.phone_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-text-secondary shrink-0">
                      <Mail size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">Email</span>
                      <p className="text-sm font-semibold text-text-primary truncate max-w-[220px]" title={selectedCustomer.email}>{selectedCustomer.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-text-secondary shrink-0 mt-0.5">
                      <MapPin size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">Address</span>
                      <p className="text-sm font-semibold text-text-primary">
                        {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.province}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-emerald-500 shrink-0">
                      <CheckCircle2 size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">Call Approval Rate</span>
                      <p className="text-sm font-bold text-emerald-600">
                        {selectedCustomer.approval_rate}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Orders History section */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={14} className="text-primary" />
                    <span>Order History ({selectedCustomer.orders.length})</span>
                  </h4>
                  {selectedCustomer.orders.length > 0 ? (
                    <div className="overflow-hidden border border-border rounded-2xl bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border text-text-secondary font-medium">
                            <th className="py-2 px-4">Order ID</th>
                            <th className="py-2 px-4">Medicine</th>
                            <th className="py-2 px-4 text-center">Qty</th>
                            <th className="py-2 px-4">Status</th>
                            <th className="py-2 px-4 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedCustomer.orders.map((o) => (
                            <tr key={o.id} className="hover:bg-surface-secondary/30 transition-colors">
                              <td className="py-2.5 px-4 font-semibold text-primary">{o.displayId}</td>
                              <td className="py-2.5 px-4 text-text-primary font-medium">{o.medicine_name}</td>
                              <td className="py-2.5 px-4 text-center text-text-secondary">{o.quantity}</td>
                              <td className="py-2.5 px-4">
                                <Badge 
                                  variant={STATUS_COLORS[o.status] || 'neutral'} 
                                  dot
                                  className="text-[10px] font-semibold py-0.5 px-2"
                                >
                                  {STATUS_LABELS[o.status] || o.status}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 text-right text-text-secondary">{formatDate(o.created_at).split(',')[0]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-surface-secondary/30 rounded-2xl border border-dashed border-border">
                      <p className="text-xs text-text-secondary">No order history recorded for this customer.</p>
                    </div>
                  )}
                </div>

                {/* Calls Logs History section */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={14} className="text-primary" />
                    <span>Call History ({selectedCustomer.calls.length})</span>
                  </h4>
                  {selectedCustomer.calls.length > 0 ? (
                    <div className="overflow-hidden border border-border rounded-2xl bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-border text-text-secondary font-medium">
                            <th className="py-2 px-4">Call ID</th>
                            <th className="py-2 px-4">Order ID</th>
                            <th className="py-2 px-4">Outcome</th>
                            <th className="py-2 px-4 text-center">Duration</th>
                            <th className="py-2 px-4 text-center">Sentiment</th>
                            <th className="py-2 px-4 text-right">Call Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedCustomer.calls.map((c) => (
                            <tr key={c.id} className="hover:bg-surface-secondary/30 transition-colors">
                              <td className="py-2.5 px-4 font-semibold text-text-primary">CALL-{String(c.id).padStart(4, '0')}</td>
                              <td className="py-2.5 px-4 font-semibold text-primary">{c.order_display_id}</td>
                              <td className="py-2.5 px-4">
                                <Badge 
                                  variant={
                                    c.outcome === 'completed' || c.outcome === 'confirmed' ? 'success' : 
                                    c.outcome === 'rejected' ? 'danger' : 
                                    c.outcome === 'need_human' ? 'warning' : 'neutral'
                                  }
                                  className="text-[10px] font-semibold py-0.5 px-2"
                                >
                                  {STATUS_LABELS[c.outcome] || c.outcome}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 text-center text-text-secondary">{Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  c.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' :
                                  c.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-500' :
                                  'bg-surface-secondary text-text-secondary'
                                }`}>
                                  {c.sentiment}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right text-text-secondary">{formatDate(c.started_at).split(',')[0]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-surface-secondary/30 rounded-2xl border border-dashed border-border">
                      <p className="text-xs text-text-secondary">No calls recorded for this customer.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

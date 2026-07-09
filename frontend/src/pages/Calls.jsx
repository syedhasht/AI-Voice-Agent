import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PageTransition } from '../components/layout';
import { Card, Button, Badge, HighlightText } from '../components/common';
import { CallLogViewer, TranscriptViewer } from '../components/orders';
import { fetchCalls, fetchCallById } from '../services';
import { Phone, ChevronLeft, ChevronRight, Filter, X, Loader, Search, Calendar } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { STATUS_LABELS } from '../utils/constants';
import { motion } from 'framer-motion';

export default function Calls() {
  const location = useLocation();
  const [calls, setCalls] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [selectedCall, setSelectedCall] = useState(null);
  const [fetchingCall, setFetchingCall] = useState(false);

  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCalls({
        page,
        limit,
        outcome: outcomeFilter === 'all' ? undefined : outcomeFilter,
        sentiment: sentimentFilter === 'all' ? undefined : sentimentFilter,
        search: search.trim() || undefined,
        date: dateFilter || undefined
      });
      setCalls(data.items || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      console.error("Calls load error:", err);
      setError("Failed to fetch call logs.");
    } finally {
      setLoading(false);
    }
  }, [page, outcomeFilter, sentimentFilter, search, dateFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.state?.selectedCallId) {
      const timer = setTimeout(() => {
        handleRowClick(location.state.selectedCallId);
      }, 150);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleFilterChange = (field, val) => {
    if (field === 'outcome') setOutcomeFilter(val);
    if (field === 'sentiment') setSentimentFilter(val);
    setPage(1);
  };

  const handleRowClick = async (callId) => {
    setFetchingCall(true);
    try {
      const data = await fetchCallById(callId);
      setSelectedCall(data);
    } catch (err) {
      console.error("Failed to load call details", err);
    } finally {
      setFetchingCall(false);
    }
  };

  const formatDuration = (sec) => {
    const minutes = Math.floor(sec / 60);
    const remaining = sec % 60;
    return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <PageTransition>
      <div className="space-y-6 pb-12 relative">
        {/* Loader Overlay for Call details */}
        {fetchingCall && (
          <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 bg-zinc-900 border border-white/5 p-6 rounded-2xl shadow-xl">
              <Loader className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-text-secondary">Retrieving call session details...</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Phone className="text-primary" />
            <span>Call History</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Voice Agent Call Log Audits ({total.toLocaleString()} total sessions)
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-start flex-wrap border border-border">
          {/* Search Inputs */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="text"
              placeholder="Search by Call ID or Customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface-secondary text-text-primary border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Outcome Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-secondary whitespace-nowrap">Outcome:</span>
            <select
              value={outcomeFilter}
              onChange={(e) => handleFilterChange('outcome', e.target.value)}
              className="w-full md:w-44 px-3 py-2 text-sm bg-surface-secondary text-text-primary border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">All Outcomes</option>
              <option value="completed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="need_human">Need Human</option>
              <option value="pending">Pending Call</option>
            </select>
          </div>

          {/* Sentiment Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm font-medium text-text-secondary whitespace-nowrap">Sentiment:</span>
            <select
              value={sentimentFilter}
              onChange={(e) => handleFilterChange('sentiment', e.target.value)}
              className="w-full md:w-44 px-3 py-2 text-sm bg-surface-secondary text-text-primary border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="all">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Calendar size={16} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-secondary whitespace-nowrap">Call Date:</span>
            <div className="relative flex items-center">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3.5 py-2 text-sm bg-surface-secondary text-text-primary border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {dateFilter && (
                <button
                  onClick={() => {
                    setDateFilter('');
                    setPage(1);
                  }}
                  className="absolute right-2 text-text-tertiary hover:text-text-primary bg-surface-secondary p-1 rounded-md"
                >
                  <X size={12} />
                </button>
              )}
            </div>
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
              <span className="text-sm text-text-secondary">Loading call logs...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-secondary font-medium bg-surface-secondary/50">
                      <th className="py-3 px-6">Call ID</th>
                      <th className="py-3 px-6">Customer</th>
                      <th className="py-3 px-6">Order</th>
                      <th className="py-3 px-6 text-center">Duration</th>
                      <th className="py-3 px-6">Outcome</th>
                      <th className="py-3 px-6">Sentiment</th>
                      <th className="py-3 px-6 text-center">Confidence</th>
                      <th className="py-3 px-6 text-right font-normal">Call Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {calls.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleRowClick(c.id)}
                        className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-6 font-semibold text-text-primary">
                          <HighlightText text={`CALL-${String(c.id).padStart(4, '0')}`} search={search} />
                        </td>
                        <td className="py-3.5 px-6 font-medium text-text-primary">
                          <HighlightText text={c.customer_name} search={search} />
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-primary">
                          ORD-{String(c.order_id).padStart(3, '0')}
                        </td>
                        <td className="py-3.5 px-6 text-center text-text-secondary">{formatDuration(c.duration_seconds)}</td>
                        <td className="py-3.5 px-6">
                          <Badge 
                            type={
                              c.outcome === 'completed' || c.outcome === 'confirmed' ? 'success' : 
                              c.outcome === 'rejected' ? 'danger' : 
                              c.outcome === 'need_human' ? 'warning' : 'neutral'
                            }
                            className="text-xs font-semibold"
                          >
                            {STATUS_LABELS[c.outcome] || c.outcome}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' :
                            c.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-500' :
                            'bg-surface-secondary text-text-secondary'
                          }`}>
                            {c.sentiment}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-center text-text-primary font-medium">
                          {Math.round(c.confidence * 100)}%
                        </td>
                        <td className="py-3.5 px-6 text-right text-xs text-text-secondary">{formatDate(c.started_at)}</td>
                      </tr>
                    ))}
                    {calls.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-text-secondary text-sm">
                          No call logs found matching the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-secondary/20">
                <span className="text-xs text-text-secondary font-medium">
                  Showing <span className="text-text-primary font-semibold">{((page - 1) * limit) + 1}</span> to{' '}
                  <span className="text-text-primary font-semibold">
                    {Math.min(page * limit, total)}
                  </span>{' '}
                  of <span className="text-text-primary font-semibold">{total.toLocaleString()}</span> call sessions
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

        {/* Call Details Modal */}
        {selectedCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white border border-border rounded-3xl p-6 overflow-hidden max-h-[85vh] flex flex-col space-y-4 shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Call Session CALL-{String(selectedCall.id).padStart(4, '0')}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Order ID: #{selectedCall.order_id} | Customer: {selectedCall.customer_name}</p>
                </div>
                <button
                  onClick={() => setSelectedCall(null)}
                  className="text-text-secondary hover:text-text-primary p-1.5 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1.5 custom-scrollbar">
                {/* Key Meta Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-secondary p-4 rounded-2xl border border-border">
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-semibold">Outcome</span>
                    <div className="mt-1">
                      <Badge 
                        type={
                          selectedCall.outcome === 'completed' || selectedCall.outcome === 'confirmed' ? 'success' : 
                          selectedCall.outcome === 'rejected' ? 'danger' : 
                          selectedCall.outcome === 'need_human' ? 'warning' : 'neutral'
                        }
                        className="text-xs font-semibold"
                      >
                        {STATUS_LABELS[selectedCall.outcome] || selectedCall.outcome}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-semibold">Sentiment</span>
                    <div className="mt-1">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        selectedCall.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' :
                        selectedCall.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-surface-tertiary text-text-secondary'
                      }`}>
                        {selectedCall.sentiment}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-semibold">Duration</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{formatDuration(selectedCall.duration_seconds)}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase font-semibold">Confidence</span>
                    <p className="text-sm font-semibold text-text-primary mt-1">{Math.round(selectedCall.confidence * 100)}%</p>
                  </div>
                </div>

                {/* Call Logs (Event steps) */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Call Logs Timeline</h4>
                  <div className="bg-surface-secondary/40 p-4 rounded-2xl border border-border">
                    <CallLogViewer logs={selectedCall.call_logs} />
                  </div>
                </div>

                {/* Chat turns (Transcript) */}
                <div className="space-y-2 text-left">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Conversation Transcript</h4>
                  {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                    <div className="bg-surface-secondary/40 p-4 rounded-2xl border border-border">
                      <TranscriptViewer transcript={selectedCall.transcript} />
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-surface-secondary/20 rounded-2xl border border-dashed border-border">
                      <p className="text-sm text-text-secondary">No chat turns recorded for this session.</p>
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

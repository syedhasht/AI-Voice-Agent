import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/layout';
import { Card, Button, Badge } from '../components/common';
import { CallLogViewer, TranscriptViewer } from '../components/orders';
import { fetchCalls, fetchCallById } from '../services';
import { Headphones, Phone, Loader, ChevronRight, X, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NeedHuman() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail call viewer state
  const [selectedCall, setSelectedCall] = useState(null);
  const [fetchingCall, setFetchingCall] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const callsRes = await fetchCalls({ outcome: 'need_human', limit: 5000 });
      setCalls((callsRes && callsRes.items) ? callsRes.items : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load need_human calls:', err);
      setError('Failed to fetch call records needing human intervention.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCallRowClick = async (callId) => {
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

  return (
    <PageTransition>
      <div className="space-y-6 pb-12 relative text-left">
        {/* Loader Overlay */}
        {fetchingCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 bg-[#071428] border border-cyan-500/10 p-6 rounded-2xl shadow-xl">
              <Loader className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-text-secondary">Retrieving call session details...</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Escalated Calls</h1>
            <p className="text-sm text-text-secondary mt-1">Review call records flagged for manual agent intervention</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 text-sm font-medium border border-amber-500/20 w-fit">
            <Headphones size={16} />
            <span>{calls.length} Escalated Calls</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-[#ffe4e6] border border-[#fda4af] text-[#be123c] text-sm">
            {error}
          </div>
        )}

        {/* Tab Contents */}
        {loading && calls.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Loading records...</span>
            </div>
          </div>
        ) : (
          <div>
            <Card className="overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-secondary font-semibold bg-surface-secondary/40">
                      <th className="py-3.5 px-4">Call ID</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4 text-center">Duration</th>
                      <th className="py-3.5 px-4">Sentiment</th>
                      <th className="py-3.5 px-4 text-right font-normal">Confidence</th>
                      <th className="py-3.5 px-4 text-right">Call Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {calls.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-surface-secondary/40 transition-colors cursor-pointer"
                        onClick={() => handleCallRowClick(c.id)}
                      >
                        <td className="py-4 px-4 font-bold text-text-primary">CALL-{c.id}</td>
                        <td className="py-4 px-4 font-semibold text-text-primary">{c.customer_name}</td>
                        <td className="py-4 px-4 text-center text-text-secondary font-medium">{formatDuration(c.duration_seconds)}</td>
                        <td className="py-4 px-4">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.sentiment === 'Positive' ? 'bg-[#dcfce7] text-[#15803d]' :
                            c.sentiment === 'Negative' ? 'bg-[#ffe4e6] text-[#be123c]' :
                            'bg-surface-secondary text-text-secondary'
                          }`}>
                            {c.sentiment}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-text-primary font-bold">{Math.round(c.confidence * 100)}%</td>
                        <td className="py-4 px-4 text-right text-xs text-text-secondary font-medium">{c.started_at ? new Date(c.started_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                    {calls.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-text-secondary">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Phone size={32} className="text-text-tertiary" />
                            <span className="font-semibold text-sm">No call escalations recorded today.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}


        {/* Drawer / Modal for Escalated Call detail */}
        <AnimatePresence>
          {selectedCall && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                onClick={() => setSelectedCall(null)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative z-51 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-border"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#071428]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-550 border border-amber-500/20">
                      <Headphones size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Call Details</h2>
                      <p className="text-xs text-[#7aa5c0] mt-0.5">Escalated Call Logs & Transcript</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCall(null)}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Summary Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-surface-secondary/40">
                      <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Customer</span>
                      <p className="text-sm font-bold text-text-primary mt-1">{selectedCall.customer_name}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-surface-secondary/40">
                      <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Duration</span>
                      <p className="text-sm font-bold text-text-primary mt-1">{formatDuration(selectedCall.duration_seconds)}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-surface-secondary/40">
                      <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Outcome</span>
                      <div className="mt-1">
                        <Badge variant="red" className="text-xs font-bold uppercase">{selectedCall.outcome}</Badge>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-surface-secondary/40">
                      <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Sentiment</span>
                      <p className="text-sm font-bold text-text-primary mt-1 flex items-center gap-1.5">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          selectedCall.sentiment === 'Positive' ? 'bg-[#22c55e]' :
                          selectedCall.sentiment === 'Negative' ? 'bg-[#f43f5e]' : 'bg-[#90aab8]'
                        }`} />
                        <span>{selectedCall.sentiment || 'Neutral'}</span>
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-surface-secondary/40">
                      <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Confidence</span>
                      <p className="text-sm font-bold text-text-primary mt-1">{Math.round(selectedCall.confidence * 100)}%</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-surface-secondary/40">
                      <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Date</span>
                      <p className="text-xs font-bold text-text-primary mt-1 flex items-center gap-1">
                        <Calendar size={12} className="text-text-tertiary" />
                        <span>{new Date(selectedCall.started_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Call Log Viewer */}
                  <div>
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                      <Clock size={16} className="text-primary" />
                      <span>Call Event Log</span>
                    </h3>
                    <CallLogViewer logs={(selectedCall.call_logs || []).map(l => ({ ...l, createdAt: l.created_at, timestamp: l.created_at }))} />
                  </div>

                  {/* Transcript Viewer */}
                  <div>
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                      <Headphones size={16} className="text-primary" />
                      <span>Call Transcript</span>
                    </h3>
                    <TranscriptViewer transcript={selectedCall.transcript} />
                  </div>
                </div>

                {/* Footer action */}
                <div className="p-4 border-t border-border bg-surface-secondary/30 flex justify-end gap-3 shrink-0">
                  <Button variant="secondary" onClick={() => setSelectedCall(null)}>
                    Close Details
                  </Button>
                  <Button variant="primary" onClick={() => {
                    setSelectedCall(null);
                    navigate(`/orders/${selectedCall.order_id}`);
                  }}>
                    View Order Details
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

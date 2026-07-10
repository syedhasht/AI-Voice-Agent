import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as framerMotion } from 'framer-motion';
import { PageTransition } from '../components/layout';
import { Card, Button, Badge } from '../components/common';
import {
  fetchDashboardSummary,
  fetchRecentOrders,
  fetchRecentCalls
} from '../services';
import {
  Users,
  ClipboardList,
  Phone,
  CheckCircle,
  XCircle,
  Headphones,
  Clock,
  DollarSign,
  Pill,
  ChevronRight,
  PlusCircle,
  Settings,
  BarChart3
} from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { STATUS_LABELS } from '../utils/constants';

const iconMap = {
  total_customers: Users,
  total_orders: ClipboardList,
  calls_today: Phone,
  confirmation_rate: CheckCircle,
  cancellation_rate: XCircle,
  need_human_count: Headphones,
  average_call_duration: Clock,
  revenue: DollarSign,
  total_medicines: Pill
};

const colorMap = {
  total_customers: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  total_orders: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  calls_today: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  confirmation_rate: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancellation_rate: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  need_human_count: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  average_call_duration: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  revenue: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  total_medicines: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20'
};

const pathMap = {
  total_customers: '/customers',
  total_orders: '/orders',
  calls_today: '/calls',
  confirmation_rate: '/analytics#outcomes-chart',
  cancellation_rate: '/analytics#outcomes-chart',
  need_human_count: '/need-human',
  average_call_duration: '/calls',
  revenue: '/analytics#revenue-chart',
  total_medicines: '/orders'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, ordersRes, callsRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchRecentOrders(),
        fetchRecentCalls()
      ]);
      setSummary(sumRes);
      setRecentOrders(ordersRes || []);
      setRecentCalls(callsRes || []);
      setError(null);
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setError("Failed to load dashboard metrics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !summary) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Loading dashboard...</span>
          </div>
        </div>
      </PageTransition>
    );
  }

  const kpis = [
    { key: 'total_customers', label: 'Total Customers', value: summary?.total_customers.toLocaleString() || '0' },
    { key: 'total_orders', label: 'Total Orders', value: summary?.total_orders.toLocaleString() || '0' },
    { key: 'calls_today', label: 'Calls Today', value: summary?.calls_today.toLocaleString() || '0' },
    { key: 'confirmation_rate', label: 'Confirmation Rate', value: `${summary?.confirmation_rate || 0}%` },
    { key: 'cancellation_rate', label: 'Cancellation Rate', value: `${summary?.cancellation_rate || 0}%` },
    { key: 'need_human_count', label: 'Escalated Calls', value: summary?.need_human_count?.toLocaleString() || '0' },
    { key: 'average_call_duration', label: 'Avg. Duration', value: `${summary?.average_call_duration || 0}s` },
    { key: 'revenue', label: 'Revenue', value: `Rs. ${summary?.revenue.toLocaleString() || '0'}` },
    { key: 'total_medicines', label: 'Total Medicines', value: summary?.total_medicines.toLocaleString() || '0' }
  ];

  return (
    <PageTransition>
      <div className="space-y-6 pb-12 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Pharmacy Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">Enterprise Operations & Call Center Overview</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-550 text-sm font-medium border border-emerald-500/20 w-fit">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Online</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
            {error}
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {kpis.map((kpi) => {
            const Icon = iconMap[kpi.key];
            return (
              <framerMotion.div
                key={kpi.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(pathMap[kpi.key])}
                className="card p-5 flex flex-col justify-between border border-border cursor-pointer hover:border-primary/40 hover:bg-surface-secondary/50 transition-all shadow-xs"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{kpi.label}</span>
                  <div className={`p-2 rounded-xl border ${colorMap[kpi.key]}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-primary mt-1">{kpi.value}</h3>
                </div>
              </framerMotion.div>
            );
          })}
        </div>

        {/* Quick actions panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/create-order')}
            className="p-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl flex items-center justify-between font-semibold group transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
          >
            <div className="flex items-center gap-3">
              <PlusCircle size={20} />
              <span>Create New Order</span>
            </div>
            <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/analytics')}
            className="p-4 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 border border-violet-500/20 rounded-2xl flex items-center justify-between font-semibold group transition-all cursor-pointer outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={20} />
              <span>Interactive Analytics</span>
            </div>
            <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate('/ai-assistant')}
            className="p-4 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 border border-sky-500/20 rounded-2xl flex items-center justify-between font-semibold group transition-all cursor-pointer outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <div className="flex items-center gap-3">
              <Users size={20} />
              <span>AI Agent</span>
            </div>
            <ChevronRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card className="p-6 overflow-hidden border border-border">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Recent Orders</h2>
                <p className="text-xs text-text-secondary mt-0.5">Top 10 most recent orders in queue</p>
              </div>
              <Button
                onClick={() => navigate('/orders')}
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-medium bg-surface-secondary/30">
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Medicine</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right font-normal">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-secondary/50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                      <td className="py-3 px-3 font-semibold text-text-primary">{o.displayId}</td>
                      <td className="py-3 px-3 text-text-secondary font-medium truncate max-w-[120px]">{o.customer}</td>
                      <td className="py-3 px-3 text-text-secondary">{o.medicine}</td>
                      <td className="py-3 px-3 text-center text-text-secondary">{o.quantity}</td>
                      <td className="py-3 px-3">
                        <Badge
                          type={
                            o.status === 'completed' || o.status === 'confirmed' ? 'success' :
                              o.status === 'rejected' ? 'danger' :
                                o.status === 'need_human' ? 'warning' : 'neutral'
                          }
                          className="text-xs font-semibold"
                        >
                          {STATUS_LABELS[o.status] || o.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-text-secondary">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-text-secondary text-sm">No recent orders.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Calls */}
          <Card className="p-6 overflow-hidden border border-border">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Recent Calls</h2>
                <p className="text-xs text-text-secondary mt-0.5">Top 10 voice agent call logs</p>
              </div>
              <Button
                onClick={() => navigate('/calls')}
                variant="outline"
                size="sm"
                className="text-xs flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-medium bg-surface-secondary/30">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-center">Duration</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Sentiment</th>
                    <th className="py-2.5 px-3 text-right font-normal">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentCalls.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/calls', { state: { selectedCallId: c.id } })}
                    >
                      <td className="py-3 px-3 font-semibold text-text-primary truncate max-w-[120px]">{c.customer}</td>
                      <td className="py-3 px-3 text-center text-text-secondary">{c.duration}s</td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' :
                            c.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-surface-secondary text-text-secondary'
                          }`}>
                          {c.sentiment}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-text-primary font-medium">{Math.round(c.confidence * 100)}%</td>
                    </tr>
                  ))}
                  {recentCalls.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-text-secondary text-sm">No recent calls recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { KPICard, RecentActivity, QuickActions } from '../components/dashboard';
import { CardSkeleton } from '../components/common';
import { PageTransition } from '../components/layout';
import { fetchOrders } from '../services';
import { Phone, TrendingUp } from 'lucide-react';
import { formatTimeAgo } from '../utils/helpers';

function computeKPIs(orders) {
  const total = orders.length;
  const pending = orders.filter((o) => o.status === 'pending').length;
  const confirmed = orders.filter((o) => o.status === 'confirmed').length;
  const modified = orders.filter((o) => o.status === 'modified').length;
  const rejected = orders.filter((o) => o.status === 'rejected').length;
  const needHuman = orders.filter((o) => o.status === 'need_human').length;

  const lastMonth = orders.filter(
    (o) => new Date(o.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return [
    { label: 'Total Orders', value: total, change: '+12%', changeType: 'positive', icon: 'ClipboardList', color: 'primary' },
    { label: 'Pending', value: pending, change: '-', changeType: pending > 0 ? 'negative' : 'positive', icon: 'Clock', color: 'amber' },
    { label: 'Confirmed', value: confirmed, change: '+', changeType: 'positive', icon: 'CheckCircle', color: 'emerald' },
    { label: 'Modified', value: modified, change: '-', changeType: 'negative', icon: 'RefreshCw', color: 'purple' },
    { label: 'Rejected', value: rejected, change: '-', changeType: 'positive', icon: 'XCircle', color: 'red' },
    { label: 'Need Human', value: needHuman, change: '-', changeType: 'negative', icon: 'Headphones', color: 'orange' },
  ];
}

function buildActivity(orders) {
  return orders.slice(0, 7).map((o) => ({
    id: o.id,
    action: `Order ${o.displayId} - ${o.customer} (${o.status})`,
    time: formatTimeAgo(o.createdAt),
    type: o.status === 'confirmed' ? 'confirmed' : o.status === 'rejected' ? 'rejected' : o.status === 'modified' ? 'modified' : o.status === 'need_human' ? 'need_human' : o.status === 'calling' ? 'calling' : 'pending',
  }));
}

export default function Dashboard() {
  const [kpis, setKpis] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({ callRate: '--', avgDuration: '--', weeklyOrders: '--' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchOrders()
      .then((orders) => {
        setKpis(computeKPIs(orders));
        setActivities(buildActivity(orders));
        setStats({
          callRate: '76%',
          avgDuration: '2m 34s',
          weeklyOrders: orders.filter(
            (o) => new Date(o.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">AI voice agent performance overview</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald/10 text-emerald-dark text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
            <span>System Online</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((kpi, i) => (
              <KPICard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                change={kpi.change}
                changeType={kpi.changeType}
                icon={kpi.icon}
                index={i}
                color={kpi.color}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity activities={activities} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Phone size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.callRate}</p>
            <p className="text-sm text-text-secondary mt-1">Call Success Rate</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald-dark">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.avgDuration}</p>
            <p className="text-sm text-text-secondary mt-1">Avg. Call Duration</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center text-amber-dark">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.weeklyOrders}</p>
            <p className="text-sm text-text-secondary mt-1">Orders This Week</p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

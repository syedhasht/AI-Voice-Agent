import { useState, useEffect } from 'react';
import { PageTransition } from '../components/layout';
import { Card } from '../components/common';
import { fetchDashboardCharts } from '../services';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Clock, MapPin, Pill, Activity } from 'lucide-react';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6'];

export default function Analytics() {
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardCharts()
      .then((data) => {
        setCharts(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Charts fetch failed:", err);
        setError("Failed to fetch analytics charts. Ensure recharts is installed.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && charts) {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          const timer = setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [loading, charts]);

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Generating charts...</span>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto space-y-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl">
            <Activity size={32} />
          </div>
          <h2 className="text-lg font-bold text-text-primary">Failed to Load Analytics</h2>
          <p className="text-sm text-text-secondary">{error}</p>
          <div className="text-xs bg-zinc-800 p-3 rounded-xl border border-white/5 text-left font-mono">
            Please verify you have run:<br />
            <span className="text-primary font-semibold">npm install recharts</span><br />
            in the frontend directory.
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">System Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Pharmacy metrics and AI Voice performance analytics</p>
        </div>

        {/* 1. Timelines row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-primary" size={18} />
              <h2 className="text-sm font-bold text-text-primary">Calls & Confirmations per Day</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts?.calls_per_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#2e2e33', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="count" name="Calls" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-indigo-400" size={18} />
              <h2 className="text-sm font-bold text-text-primary">Orders per Day</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.orders_per_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#2e2e33', borderRadius: 8 }} />
                  <Bar dataKey="count" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 2. Outcomes & Popularity row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card id="outcomes-chart" className="p-6 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="text-emerald-400" size={18} />
              <h2 className="text-sm font-bold text-text-primary">Order Outcomes</h2>
            </div>
            <div className="h-72 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.outcomes}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts?.outcomes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#2e2e33', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="text-purple-400" size={18} />
              <h2 className="text-sm font-bold text-text-primary">Medicine Popularity (Top Ordered Quantities)</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.medicine_popularity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis type="number" stroke="#888888" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#2e2e33', borderRadius: 8 }} />
                  <Bar dataKey="count" name="Total Units" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 3. Revenue Trend */}
        <Card id="revenue-chart" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-teal-400" size={18} />
            <h2 className="text-sm font-bold text-text-primary">Revenue Trend (Last 30 Days)</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#2e2e33', borderRadius: 8 }} formatter={(v) => `Rs. ${v}`} />
                <Line type="monotone" dataKey="amount" name="Revenue (PKR)" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 4. Distribution and top cities row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-sky-400" size={18} />
              <h2 className="text-sm font-bold text-text-primary">Call Volume by Hour (Distribution)</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.calls_by_hour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="hour" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#2e2e33', borderRadius: 8 }} />
                  <Bar dataKey="count" name="Calls" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-rose-400" size={18} />
              <h2 className="text-sm font-bold text-text-primary">Customers by City</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.top_cities}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="city" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#2e2e33', borderRadius: 8 }} />
                  <Bar dataKey="count" name="Customers" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 5. Customer signup growth */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-400" size={18} />
            <h2 className="text-sm font-bold text-text-primary">Customer Signup Flow (Daily Growth)</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.customer_growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#2e2e33', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" name="Signups" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}

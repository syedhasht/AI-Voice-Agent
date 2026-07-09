import { useState, useRef, useEffect, useCallback } from 'react';
import { PageTransition } from '../components/layout';
import { Card } from '../components/common';
import { queryAssistant } from '../services';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Database, MessageSquare, BarChart3,
  Copy, Download, ChevronDown, ChevronUp, AlertCircle,
  Bot, User, Loader2, CheckCircle, TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const CHART_COLORS = [
  '#6366f1', '#10b981', '#f43f5e', '#f59e0b',
  '#3b82f6', '#8b5cf6', '#14b8a6', '#ec4899',
];

const SUGGESTED_QUESTIONS = [
  'Which medicine has the highest cancellation rate?',
  'Which customers need a callback?',
  'Compare today\'s calls with yesterday.',
  'Show top-selling medicines by quantity.',
  'Which city has the highest confirmation rate?',
  'Show revenue by city.',
  'Which AI agent handled the most conversations?',
  'Which hour has the highest call volume?',
  'Which customers cancelled more than 3 orders?',
  'Show orders waiting for human intervention.',
];

// ─── Chart Component ──────────────────────────────────────────────────────────

function ResultChart({ chart }) {
  if (!chart || chart.type === 'none' || !chart.data?.length) return null;

  const { type, x_key, y_key, data } = chart;

  const commonProps = {
    data,
    margin: { top: 5, right: 20, left: 10, bottom: 5 },
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
      borderRadius: 8,
      fontSize: 12,
    },
  };

  const chartContent = () => {
    if (type === 'pie') {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={y_key}
            nameKey={x_key}
            cx="50%"
            cy="50%"
            outerRadius={100}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      );
    }

    if (type === 'line') {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey={x_key} stroke="var(--color-text-secondary)" fontSize={11} />
          <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
          <Tooltip {...tooltipStyle} />
          <Line
            type="monotone"
            dataKey={y_key}
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      );
    }

    // Default: bar
    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey={x_key} stroke="var(--color-text-secondary)" fontSize={11} />
        <YAxis stroke="var(--color-text-secondary)" fontSize={11} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={y_key} fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  };

  const chartLabel = { bar: 'Bar Chart', line: 'Line Chart', pie: 'Pie Chart' }[type] || 'Chart';

  return (
    <Card className="p-5 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-violet-500" />
        <span className="text-sm font-semibold text-text-primary">{chartLabel}</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartContent()}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── SQL Viewer ───────────────────────────────────────────────────────────────

function SqlViewer({ sql }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!sql) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Simple SQL keyword highlighter
  const highlighted = sql
    .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|AS|COUNT|SUM|AVG|MAX|MIN|DISTINCT|AND|OR|NOT|IN|LIKE|IS|NULL|COALESCE|CASE|WHEN|THEN|ELSE|END|WITH|UNION|DATE|strftime)\b/g,
      '<span class="text-violet-400 font-bold">$1</span>')
    .replace(/'([^']*)'/g, '<span class="text-emerald-400">\'$1\'</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return (
    <Card className="border border-border overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-secondary/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Database size={15} className="text-emerald-500" />
          <span className="text-sm font-semibold text-text-primary">Generated SQL</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            {copied ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {open ? <ChevronUp size={15} className="text-text-secondary" /> : <ChevronDown size={15} className="text-text-secondary" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 border-t border-border">
              <pre
                className="mt-4 p-4 bg-zinc-950 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed text-text-primary"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Results Table ────────────────────────────────────────────────────────────

function ResultsTable({ columns, rows }) {
  if (!columns?.length || !rows?.length) return null;

  const handleExportCsv = () => {
    const header = columns.join(',');
    const body = rows.map(row =>
      row.map(v => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v)).join(',')
    ).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_assistant_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <Database size={13} className="text-blue-500" />
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Results
        </span>
        <span className="text-xs text-text-tertiary ml-auto">{rows.length} row{rows.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-surface-secondary/80 backdrop-blur-sm border-b border-border">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, ri) => (
              <tr key={ri} className="hover:bg-surface-secondary/40 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-text-primary text-xs whitespace-nowrap">
                    {cell === null || cell === undefined ? (
                      <span className="text-text-tertiary italic">null</span>
                    ) : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] flex items-start gap-2.5">
          <div className="bg-primary text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-sm">
            {message.content}
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <User size={15} className="text-primary" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="max-w-full w-full flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={15} className="text-violet-500" />
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          {/* Error message */}
          {message.is_error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{message.summary}</p>
            </div>
          )}

          {/* Conversational reply */}
          {!message.is_error && !message.generated_sql && (
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-secondary border border-border text-sm text-text-primary leading-relaxed space-y-1.5">
              {message.summary.split('\n').map((line, i) => {
                const isBullet = line.trim().startsWith('•');
                if (!line.trim()) return null;
                return isBullet ? (
                  <div key={i} className="flex items-start gap-2 pl-1">
                    <span className="text-violet-500 shrink-0 mt-0.5">•</span>
                    <span className="text-text-secondary">{line.trim().replace(/^•\s*/, '')}</span>
                  </div>
                ) : (
                  <p key={i}>{line}</p>
                );
              })}
            </div>
          )}

          {/* Business insight */}
          {!message.is_error && message.generated_sql && message.summary && (
            <Card className="p-4 border border-border bg-gradient-to-br from-violet-500/5 to-transparent">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-violet-500" />
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Business Insight</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">{message.summary}</p>
            </Card>
          )}

          {/* SQL hidden — shown only in debug mode */}

          {/* Chart */}
          {message.chart && message.chart.type !== 'none' && (
            <ResultChart chart={message.chart} />
          )}

          {/* Results Table */}
          {message.columns?.length > 0 && message.rows?.length > 0 && (
            <ResultsTable columns={message.columns} rows={message.rows} />
          )}

          {/* Empty results */}
          {message.generated_sql && !message.is_error && message.rows?.length === 0 && (
            <div className="px-4 py-3 rounded-xl bg-surface-secondary border border-border text-sm text-text-secondary">
              No records matched your query criteria.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
        <Bot size={15} className="text-violet-500" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-secondary border border-border flex items-center gap-1.5">
        <Loader2 size={14} className="text-violet-500 animate-spin" />
        <span className="text-xs text-text-secondary">Gemini is thinking...</span>
        <span className="flex gap-0.5 ml-1">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-violet-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleSubmit = useCallback(async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const result = await queryAssistant(q);
      setMessages(prev => [...prev, { role: 'assistant', ...result }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          summary: err.message || 'Failed to connect to the AI Assistant. Please try again.',
          is_error: true,
          generated_sql: null,
          columns: [],
          rows: [],
          chart: { type: 'none' },
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <PageTransition className="h-full">
      <div className="flex flex-col h-full max-w-5xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 py-3 px-1 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles size={20} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Enterprise AI Assistant</h1>
            <p className="text-xs text-text-secondary">Natural Language → SQL → Business Insights · Powered by Gemini</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>

        {/* Chat Area — this is the only scrollable region */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface/50 p-4 space-y-5 mb-3 min-h-0">
          {/* Empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 py-8"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
                  <Sparkles size={28} className="text-violet-500" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">Ask anything about your business</h2>
                <p className="text-sm text-text-secondary max-w-md mx-auto">
                  I analyze your pharmacy database in real-time using AI-generated SQL.
                  Ask about orders, calls, customers, revenue, medicines, and more.
                </p>
              </div>

              {/* Suggested questions */}
              <div className="w-full max-w-2xl">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Suggested questions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSubmit(q)}
                      className="text-left text-xs text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-tertiary border border-border hover:border-primary/30 px-3 py-2.5 rounded-xl transition-all group"
                    >
                      <span className="group-hover:text-primary transition-colors">→</span>
                      {' '}{q}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <TypingIndicator />
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area — pinned at the bottom, never scrolls */}
        <div className="shrink-0">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a business question… e.g. Which city has the most confirmed orders?"
                rows={1}
                disabled={loading}
                className="w-full pl-4 pr-12 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none transition-all disabled:opacity-60 max-h-32 overflow-y-auto"
                style={{ lineHeight: '1.5' }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || loading}
              className="h-11 w-11 rounded-2xl bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-sm shadow-primary/20 shrink-0"
            >
              {loading
                ? <Loader2 size={17} className="animate-spin" />
                : <Send size={17} />
              }
            </button>
          </div>
          <p className="text-xs text-text-tertiary mt-2 text-center">
            <MessageSquare size={11} className="inline mr-1" />
            Press <kbd className="px-1 py-0.5 rounded text-[10px] bg-surface-secondary border border-border font-mono">Enter</kbd> to send
            · Only read-only queries are executed · Data from your live database
          </p>
        </div>
      </div>
    </PageTransition>
  );
}

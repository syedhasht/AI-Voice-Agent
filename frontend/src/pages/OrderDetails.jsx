import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, User, Pill, Package, Clock, Edit3, Trash2, Save, X, Bot, MessageSquare, Headphones, Tag, MapPin } from 'lucide-react';
import { Badge, Button, Card, Input, ConfirmDialog } from '../components/common';
import { OrderTimeline, CallLogViewer, TranscriptViewer } from '../components/orders';
import { PageTransition } from '../components/layout';
import { fetchOrderById, updateOrder, deleteOrder } from '../services';
import { STATUS, STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import { formatDate, isActiveStatus } from '../utils/helpers';
import { useToast } from '../context';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);


  const [form, setForm] = useState({ quantity: '', status: '', notes: '' });
  const prevStatusRef = useRef(null);

  const load = useCallback((showSkeleton = false) => {
    if (showSkeleton) {
      setLoading(true);
    }
    setError(null);
    fetchOrderById(id)
      .then((data) => {
        setOrder((prev) => {
          prevStatusRef.current = prev?.status;
          return data;
        });
        if (!editing) {
          setForm({ quantity: data.quantity, status: data.status, notes: data.notes || '' });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        if (showSkeleton) {
          setLoading(false);
        }
      });
  }, [id, editing]);

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 3000);
    return () => clearInterval(interval);
  }, [id, load]);

  const isActive = order && isActiveStatus(order.status);

  const handleSave = async () => {
    if (isActive) return;
    setSaving(true);
    try {
      const updates = {};
      if (Number(form.quantity) !== order.quantity) updates.quantity = Number(form.quantity);
      if (form.status !== order.status) updates.status = form.status;
      if (form.notes !== (order.notes || '')) updates.notes = form.notes;
      if (Object.keys(updates).length === 0) { setEditing(false); return; }
      const updated = await updateOrder(id, updates);
      setOrder(updated);
      setEditing(false);
      toast.success('Order updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOrder(id);
      toast.success('Order deleted successfully');
      navigate('/orders');
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const handleRetryLoad = () => { setError(null); load(); };

  if (loading && !order) {
    return (
      <PageTransition>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="skeleton-pulse h-8 w-48 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card p-6 space-y-4">
                <div className="skeleton-pulse h-6 w-32 rounded" />
                <div className="skeleton-pulse h-4 w-64 rounded" />
                <div className="skeleton-pulse h-4 w-48 rounded" />
                <div className="skeleton-pulse h-4 w-56 rounded" />
              </div>
            </div>
            <div><div className="card p-6 space-y-4"><div className="skeleton-pulse h-6 w-32 rounded" /><div className="skeleton-pulse h-4 w-full rounded" /><div className="skeleton-pulse h-4 w-full rounded" /><div className="skeleton-pulse h-4 w-full rounded" /></div></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-accent/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to load order</h2>
          <p className="text-sm text-text-secondary mb-4">{error}</p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/orders')}>Back to Orders</Button>
            <Button onClick={handleRetryLoad}>Retry</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!order) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-text-primary mb-2">Order not found</h2>
          <Button variant="ghost" onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </PageTransition>
    );
  }

  const infoItems = [
    { icon: User, label: 'Customer', value: order.customer },
    ...(order.customerCode ? [{ icon: User, label: 'Customer ID', value: order.customerCode }] : []),
    { icon: Phone, label: 'Phone', value: order.phone },
    ...(order.customerAddress ? [{ icon: MapPin, label: 'Address', value: order.customerAddress }] : []),
    { icon: Pill, label: 'Medicine', value: order.medicine },
    { icon: Package, label: 'Quantity', value: order.quantity },
    { icon: Tag, label: 'Order Amount', value: `Rs. ${(order.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { icon: Clock, label: 'Created', value: formatDate(order.createdAt) },
    ...(order.callDurationSeconds ? [{ icon: Clock, label: 'Call Duration', value: `${order.callDurationSeconds}s` }] : []),
  ];

  return (
    <PageTransition>
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Order"
        message={`Are you sure you want to delete ${order.displayId}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary font-mono">{order.displayId}</h1>
              {isActive && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  {STATUS_LABELS[order.status]}
                </span>
              )}
              {!isActive && (
                <Badge variant={STATUS_COLORS[order.status]} dot>
                  {STATUS_LABELS[order.status]}
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary mt-0.5">Order Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Order Info + Logs + Transcript */}
          <div className="lg:col-span-3 space-y-6">
            {/* Order Info Card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Order Information</h3>
                <div className="flex gap-2">
                  {!editing ? (
                    <>
                      <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setEditing(true)} disabled={isActive} title={isActive ? 'Cannot edit during active call' : ''}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setShowDelete(true)} className="text-red-accent hover:bg-red-accent/10">
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" icon={X} onClick={() => { setEditing(false); setForm({ quantity: order.quantity, status: order.status, notes: order.notes || '' }); }}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" icon={Save} onClick={handleSave} loading={saving}>
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>

               {isActive && !editing && (
                <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                  <p className="text-sm text-primary font-medium">
                    {order.status === 'calling' ? 'AI is contacting the customer...' :
                     order.status === 'in_progress' ? 'Conversation is happening...' :
                     order.status === 'processing' ? 'Processing the conversation result...' :
                     'AI workflow in progress...'}
                  </p>
                </div>
              )}

              {order.status === 'pending' && !editing && (
                <div className="mb-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Headphones size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">Voice Call Simulation</h4>
                      <p className="text-xs text-text-secondary mt-0.5">Start an interactive voice session for this order using the ElevenLabs agent.</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Headphones}
                    onClick={() => navigate(`/voice/${order.id}`)}
                    className="w-full sm:w-auto shrink-0 shadow-lg shadow-primary/20"
                  >
                    Simulate Call
                  </Button>
                </div>
              )}

              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} min="1" />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-text-secondary">Status</label>
                      <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="pending">Pending Call</option>
                        <option value="in_progress">In Call</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="modified">Modified</option>
                        <option value="rejected">Rejected</option>
                        <option value="need_human">Need Human</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-secondary">Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {infoItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                      <div className="w-9 h-9 rounded-lg bg-white border border-border flex items-center justify-center text-text-secondary shrink-0">
                        <item.icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-text-tertiary">{item.label}</p>
                        <p className="text-sm font-medium text-text-primary truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {order.notes && !editing && (
              <Card>
                <h3 className="text-sm font-semibold text-text-primary mb-2">Notes</h3>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{order.notes}</p>
              </Card>
            )}

            {/* Call Logs Section */}
            <Card>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Call Logs</h3>
                <span className="text-xs text-text-tertiary">{order.callLogs?.length || 0} entries</span>
              </div>
              <CallLogViewer logs={order.callLogs} />
            </Card>

            {/* Transcript Section */}
            {order.transcript && order.transcript.length > 0 && (
              <Card>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <Bot size={15} className="text-primary" />
                    <h3 className="text-sm font-semibold text-text-primary">Call Transcript</h3>
                  </div>
                  <span className="text-xs text-text-tertiary">{order.transcript.length} turns</span>
                </button>
                {showTranscript && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <TranscriptViewer transcript={order.transcript} />
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right: Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-5">Status Timeline</h3>
              <OrderTimeline timeline={order.timeline} />
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

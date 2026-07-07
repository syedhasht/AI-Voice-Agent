export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function mapOrderFromApi(order) {
  let transcript = [];
  if (order.transcript_json) {
    try {
      transcript = JSON.parse(order.transcript_json);
    } catch { transcript = []; }
  }
  return {
    id: order.id,
    displayId: `ORD-${String(order.id).padStart(3, '0')}`,
    customer: order.customer_name,
    phone: order.phone_number,
    medicine: order.medicine_name,
    quantity: order.quantity,
    status: order.status,
    notes: order.notes || '',
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    retellCallId: order.retell_call_id || null,
    callDurationSeconds: order.call_duration_seconds,
    transcript,
    timeline: (order.timeline || []).map((t) => ({
      status: t.status,
      timestamp: t.created_at,
      note: t.note || '',
    })),
    callLogs: (order.call_logs || []).map((l) => ({
      id: l.id,
      step: l.step,
      message: l.message || '',
      createdAt: l.created_at,
    })),
  };
}

export function mapOrderToApi(form) {
  return {
    customer_name: form.customer,
    phone_number: form.phone,
    medicine_name: form.medicine,
    quantity: Number(form.quantity),
    notes: form.notes || '',
  };
}

export function isActiveStatus(status) {
  return ['queued', 'calling', 'in_progress', 'processing', 'simulating'].includes(status);
}

export function isFinalStatus(status) {
  return ['confirmed', 'rejected', 'need_human', 'completed'].includes(status);
}

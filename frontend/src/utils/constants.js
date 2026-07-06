export const STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  CALLING: 'calling',
  IN_PROGRESS: 'in_progress',
  PROCESSING: 'processing',
  CONFIRMED: 'confirmed',
  MODIFIED: 'modified',
  REJECTED: 'rejected',
  NEED_HUMAN: 'need_human',
};

export const STATUS_LABELS = {
  [STATUS.PENDING]: 'Pending',
  [STATUS.QUEUED]: 'Queued',
  [STATUS.CALLING]: 'Calling',
  [STATUS.IN_PROGRESS]: 'In Progress',
  [STATUS.PROCESSING]: 'Processing',
  [STATUS.CONFIRMED]: 'Confirmed',
  [STATUS.MODIFIED]: 'Modified',
  [STATUS.REJECTED]: 'Rejected',
  [STATUS.NEED_HUMAN]: 'Need Human',
};

export const STATUS_COLORS = {
  [STATUS.PENDING]: 'amber',
  [STATUS.QUEUED]: 'blue',
  [STATUS.CALLING]: 'blue',
  [STATUS.IN_PROGRESS]: 'blue',
  [STATUS.PROCESSING]: 'blue',
  [STATUS.CONFIRMED]: 'emerald',
  [STATUS.MODIFIED]: 'purple',
  [STATUS.REJECTED]: 'red',
  [STATUS.NEED_HUMAN]: 'orange',
};

export const CALL_STEPS = {
  [STATUS.QUEUED]: 'Order queued for AI call',
  [STATUS.CALLING]: 'AI agent is dialing',
  [STATUS.IN_PROGRESS]: 'Conversation in progress',
  [STATUS.PROCESSING]: 'Processing result',
  completed: 'Call completed',
};

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Orders', path: '/orders', icon: 'ClipboardList' },
  { label: 'Create Order', path: '/create-order', icon: 'PlusCircle' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
];

export const ITEMS_PER_PAGE = 10;

export const API_BASE = 'http://localhost:8000/api';

export const POLL_INTERVAL = 3000;

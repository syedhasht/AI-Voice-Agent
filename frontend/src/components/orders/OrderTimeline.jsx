import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Phone, RefreshCw, Headphones, Circle, MessageSquare, Loader } from 'lucide-react';
import { formatDate, classNames } from '../../utils/helpers';

const stepIcons = {
  pending: CheckCircle,
  awaiting: Clock,
  simulating: MessageSquare,
  modified: RefreshCw,
  approved: CheckCircle,
  rejected: XCircle,
  need_human: Headphones,
};

const stepColors = {
  pending: 'border-emerald text-emerald bg-emerald/10',
  awaiting: 'border-amber text-amber bg-amber/10',
  simulating: 'border-primary text-primary bg-primary/10',
  modified: 'border-purple text-purple bg-purple/10',
  approved: 'border-emerald text-emerald bg-emerald/10',
  rejected: 'border-red-accent text-red-accent bg-red-accent/10',
  need_human: 'border-orange text-orange bg-orange/10',
};

const getIconAndColor = (step) => {
  let iconKey = step.key;
  if (step.key === 'outcome' && step.entry) {
    if (step.entry.status === 'completed' || step.entry.status === 'confirmed') iconKey = 'approved';
    else if (step.entry.status === 'rejected') iconKey = 'rejected';
    else if (step.entry.status === 'need_human') iconKey = 'need_human';
  }
  const Icon = stepIcons[iconKey] || Circle;
  const colorClass = stepColors[iconKey] || 'border-border text-text-tertiary bg-surface-secondary';
  return { Icon, colorClass };
};

export default function OrderTimeline({ timeline }) {
  const steps = [];

  // 1. Order Created
  const pendingEntry = timeline.find((t) => t.status === 'pending');
  steps.push({
    key: 'pending',
    label: 'Order Created',
    isCompleted: true,
    entry: pendingEntry,
  });

  // 2. Awaiting Call
  const hasMovedPastAwaiting = timeline.some((t) =>
    ['simulating', 'calling', 'in_progress', 'completed', 'rejected', 'need_human'].includes(t.status)
  );
  const isAwaitingActive = !hasMovedPastAwaiting;
  steps.push({
    key: 'awaiting',
    label: 'Awaiting Call',
    isCompleted: hasMovedPastAwaiting,
    isActive: isAwaitingActive,
    entry: timeline.find((t) => t.status === 'queued') || pendingEntry,
  });

  // 3. Simulation in Progress
  const simulatingEntry = timeline.find((t) => t.status === 'simulating');
  const isSimulatingActive = timeline.some((t) =>
    ['simulating', 'calling', 'in_progress'].includes(t.status)
  ) && !timeline.some((t) => ['completed', 'rejected', 'need_human'].includes(t.status));
  const isSimulatingCompleted = timeline.some((t) =>
    ['completed', 'rejected', 'need_human'].includes(t.status)
  );

  if (simulatingEntry || isSimulatingActive || isSimulatingCompleted) {
    steps.push({
      key: 'simulating',
      label: isSimulatingActive ? 'Simulation In Progress' : 'Simulation Completed',
      isCompleted: isSimulatingCompleted,
      isActive: isSimulatingActive,
      entry: simulatingEntry,
    });
  }

  // 4. Order Details Modified (only visible if there was a modification event)
  const modifiedEntry = timeline.find((t) =>
    t.status === 'modified' || (t.note && t.note.toLowerCase().includes('quantity changed'))
  );
  if (modifiedEntry) {
    steps.push({
      key: 'modified',
      label: 'Order Details Modified',
      isCompleted: true,
      entry: modifiedEntry,
    });
  }

  // 5. Final Outcome
  const finalEntry = timeline.find((t) =>
    ['completed', 'rejected', 'need_human'].includes(t.status)
  );
  if (finalEntry) {
    let outcomeLabel = 'Approved';
    if (finalEntry.status === 'rejected') outcomeLabel = 'Rejected';
    if (finalEntry.status === 'need_human') outcomeLabel = 'Escalated to Human';

    steps.push({
      key: 'outcome',
      label: outcomeLabel,
      isCompleted: true,
      entry: finalEntry,
    });
  } else if (!isAwaitingActive) {
    steps.push({
      key: 'outcome',
      label: 'Awaiting Outcome',
      isCompleted: false,
      isActive: true,
    });
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isCompleted = step.isCompleted;
        const isActive = step.isActive;
        const { Icon, colorClass } = getIconAndColor(step);

        return (
          <motion.div
            key={step.key + i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex gap-4 pb-5 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <div className={classNames(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-200',
                isCompleted ? colorClass : isActive ? 'border-primary bg-primary/5 text-primary animate-pulse' : 'border-border bg-white text-text-tertiary'
              )}>
                {isActive && step.key !== 'outcome' ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Icon size={14} />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={classNames(
                  'w-0.5 flex-1 mt-2',
                  isCompleted ? 'bg-emerald/30' : 'bg-border'
                )} />
              )}
            </div>
            <div className="pt-1.5 min-w-0 flex-1">
              <p className={classNames(
                'text-sm font-medium',
                isCompleted ? 'text-text-primary' : isActive ? 'text-primary' : 'text-text-tertiary'
              )}>
                {step.label}
                {isActive && '...'}
              </p>
              {step.entry?.note && (
                <p className="text-xs text-text-secondary mt-0.5">{step.entry.note}</p>
              )}
              {step.entry?.created_at && (
                <p className="text-xs text-text-tertiary mt-0.5">{formatDate(step.entry.created_at)}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

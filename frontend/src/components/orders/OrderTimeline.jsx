import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Phone, RefreshCw, Headphones, AlertCircle, Circle, MessageSquare, Loader } from 'lucide-react';
import { STATUS, STATUS_LABELS } from '../../utils/constants';
import { formatDate, classNames } from '../../utils/helpers';

const timelineIcons = {
  [STATUS.CONFIRMED]: CheckCircle,
  [STATUS.REJECTED]: XCircle,
  [STATUS.PENDING]: Clock,
  [STATUS.QUEUED]: Loader,
  [STATUS.CALLING]: Phone,
  [STATUS.IN_PROGRESS]: MessageSquare,
  [STATUS.PROCESSING]: Loader,
  [STATUS.MODIFIED]: RefreshCw,
  [STATUS.NEED_HUMAN]: Headphones,
};

const timelineColors = {
  [STATUS.CONFIRMED]: 'border-emerald text-emerald bg-emerald/10',
  [STATUS.REJECTED]: 'border-red-accent text-red-accent bg-red-accent/10',
  [STATUS.PENDING]: 'border-amber text-amber bg-amber/10',
  [STATUS.QUEUED]: 'border-primary text-primary bg-primary/10',
  [STATUS.CALLING]: 'border-primary text-primary bg-primary/10',
  [STATUS.IN_PROGRESS]: 'border-primary text-primary bg-primary/10',
  [STATUS.PROCESSING]: 'border-primary text-primary bg-primary/10',
  [STATUS.MODIFIED]: 'border-purple-500 text-purple-700 bg-purple-500/10',
  [STATUS.NEED_HUMAN]: 'border-orange-500 text-orange-700 bg-orange-500/10',
};

const allStatuses = [
  STATUS.PENDING, STATUS.QUEUED, STATUS.CALLING,
  STATUS.IN_PROGRESS, STATUS.PROCESSING,
  STATUS.CONFIRMED, STATUS.MODIFIED, STATUS.REJECTED, STATUS.NEED_HUMAN,
];

export default function OrderTimeline({ timeline }) {
  return (
    <div className="space-y-0">
      {allStatuses.map((status, i) => {
        const entry = timeline.find((t) => t.status === status);
        const isCompleted = !!entry;
        const isActive = !isCompleted && i > 0 && timeline.length > 0 &&
          i === timeline.length &&
          !['confirmed', 'modified', 'rejected', 'need_human'].includes(status);
        const Icon = timelineIcons[status] || Circle;
        const colorClasses = timelineColors[status] || 'border-gray-300 text-gray-400';

        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex gap-4 pb-5 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <div className={classNames(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-200',
                isCompleted ? colorClasses : isActive ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-white text-text-tertiary'
              )}>
                {isActive ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Icon size={14} />
                )}
              </div>
              {i < allStatuses.length - 1 && (
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
                {STATUS_LABELS[status]}
                {isActive && '...'}
              </p>
              {entry?.note && (
                <p className="text-xs text-text-secondary mt-0.5">{entry.note}</p>
              )}
              {entry && (
                <p className="text-xs text-text-tertiary mt-0.5">{formatDate(entry.timestamp)}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

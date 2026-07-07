import { motion } from 'framer-motion';
import { Phone, MessageSquare, CheckCircle, Loader, RefreshCw, XCircle, Headphones } from 'lucide-react';
import { classNames, formatDate } from '../../utils/helpers';
import { CALL_STEPS } from '../../utils/constants';

const stepIcons = {
  queued: Loader,
  retell_request: Loader,
  calling: Phone,
  call_started: Phone,
  in_progress: MessageSquare,
  processing: Loader,
  call_completed: CheckCircle,
  completed: CheckCircle,
  confirmed: CheckCircle,
  modified: RefreshCw,
  cancelled: XCircle,
  escalated: Headphones,
  call_failed: XCircle,
  webhook_sending: Loader,
  webhook_delivered: CheckCircle,
  webhook_failed: XCircle,
};

const friendlySteps = {
  call_started: 'Call Started',
  call_completed: 'Call Completed',
  confirmed: 'Order Confirmed',
  modified: 'Order Modified',
  cancelled: 'Order Cancelled',
  escalated: 'Escalated to Human',
};

export default function CallLogViewer({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-text-tertiary">No call logs yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const Icon = stepIcons[log.step] || Loader;
        const isLast = i === logs.length - 1;
        const isActive = isLast && ['queued', 'calling', 'in_progress', 'processing'].includes(log.step);

        return (
          <motion.div
            key={log.id || i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <div className={classNames(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface-secondary text-text-tertiary'
              )}>
                {isActive ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Icon size={14} />
                )}
              </div>
              {!isLast && <div className="w-0.5 flex-1 mt-1.5 bg-border" />}
            </div>
            <div className="pt-1 min-w-0 flex-1">
              <p className={classNames(
                'text-sm',
                isActive ? 'font-medium text-primary' : 'text-text-secondary'
              )}>
                {friendlySteps[log.step] || CALL_STEPS[log.step] || log.step}
              </p>
              {log.message && (
                <p className="text-xs text-text-secondary mt-0.5">{log.message}</p>
              )}
              {log.timestamp && (
                <p className="text-[10px] text-text-tertiary mt-0.5">{formatDate(log.timestamp)}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

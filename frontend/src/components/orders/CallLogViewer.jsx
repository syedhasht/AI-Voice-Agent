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
  simulation_started: Phone,
  session_completed: CheckCircle,
  session_ended: XCircle,
  session_escalated: Headphones
};

const friendlySteps = {
  call_started: 'Call Started',
  simulation_started: 'Call Started',
  call_completed: 'Call Completed',
  session_completed: 'Call Completed',
  session_ended: 'Call Completed',
  session_escalated: 'Call Escalated',
  confirmed: 'Order Confirmed',
  modified: 'Order Modified',
  cancelled: 'Order Cancelled',
  escalated: 'Escalated to Human',
};

const calcDuration = (start, end) => {
  if (!start || !end) return '0s';
  const startTime = new Date(start.createdAt || start.timestamp);
  const endTime = new Date(end.createdAt || end.timestamp);
  const diffSec = Math.round((endTime - startTime) / 1000);
  if (isNaN(diffSec) || diffSec < 0) return '0s';
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

export default function CallLogViewer({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-text-tertiary">No call logs yet</p>
      </div>
    );
  }

  // Find start log
  const startLog = logs.find(l => l.step === 'call_started' || l.step === 'simulation_started');

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const Icon = stepIcons[log.step] || Loader;
        const isLast = i === logs.length - 1;
        const isActive = isLast && ['queued', 'calling', 'in_progress', 'processing'].includes(log.step);

        const isStart = log.step === 'call_started' || log.step === 'simulation_started';
        const isComplete = log.step === 'call_completed' || log.step === 'session_completed' || log.step === 'session_ended' || log.step === 'session_escalated';

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
                'text-sm font-semibold',
                isActive ? 'text-primary' : 'text-text-primary'
              )}>
                {friendlySteps[log.step] || CALL_STEPS[log.step] || log.step}
              </p>
              {log.message && (
                <p className="text-xs text-text-secondary mt-0.5">{log.message}</p>
              )}
              
              {/* Duration metadata info row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-text-tertiary font-medium">
                {isStart && (
                  <span>Started: {formatDate(log.createdAt || log.timestamp)}</span>
                )}
                {isComplete && (
                  <>
                    <span>Started: {startLog ? formatDate(startLog.createdAt || startLog.timestamp) : 'N/A'}</span>
                    <span>Ended: {formatDate(log.createdAt || log.timestamp)}</span>
                    <span>Duration: {calcDuration(startLog, log)}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

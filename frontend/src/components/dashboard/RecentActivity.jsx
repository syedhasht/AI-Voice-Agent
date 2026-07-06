import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Phone, RefreshCw, Headphones, AlertCircle } from 'lucide-react';
import { Card } from '../common';
import { classNames } from '../../utils/helpers';

const activityIcons = {
  confirmed: CheckCircle,
  rejected: XCircle,
  pending: Clock,
  calling: Phone,
  modified: RefreshCw,
  need_human: Headphones,
};

const activityColors = {
  confirmed: 'text-emerald bg-emerald/10',
  rejected: 'text-red-accent bg-red-accent/10',
  pending: 'text-amber bg-amber/10',
  calling: 'text-primary bg-primary/10',
  modified: 'text-primary bg-primary/10',
  need_human: 'text-amber bg-amber/10',
};

export default function RecentActivity({ activities }) {
  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((item, i) => {
          const Icon = activityIcons[item.type] || AlertCircle;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 py-2"
            >
              <div className={classNames('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', activityColors[item.type])}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary truncate">{item.action}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{item.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

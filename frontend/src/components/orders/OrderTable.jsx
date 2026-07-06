import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, PlusCircle, Phone, Loader } from 'lucide-react';
import { Badge, Button } from '../common';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';
import { formatDate, isActiveStatus } from '../../utils/helpers';

export default function OrderTable({ orders }) {
  const navigate = useNavigate();

  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-tertiary flex items-center justify-center">
          <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">No orders yet</h3>
        <p className="text-sm text-text-secondary mb-4">Create your first medication order to get started.</p>
        <Button icon={PlusCircle} onClick={() => navigate('/create-order')}>
          Create Order
        </Button>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-5 py-4">Order ID</th>
              <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-5 py-4">Customer</th>
              <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-5 py-4">Phone</th>
              <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-5 py-4">Medicine</th>
              <th className="text-center text-xs font-semibold text-text-tertiary uppercase tracking-wider px-5 py-4">Qty</th>
              <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-5 py-4">Created</th>
              <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-5 py-4">Status</th>
              <th className="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wider px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order, i) => {
              const active = isActiveStatus(order.status);
              return (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={classNames(
                    'group transition-colors cursor-pointer',
                    active ? 'bg-primary/[0.02]' : 'hover:bg-surface-secondary/50'
                  )}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono font-medium text-primary">{order.displayId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-text-primary">{order.customer}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-text-secondary">{order.phone}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-text-primary">{order.medicine}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm font-medium text-text-primary">{order.quantity}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-text-secondary whitespace-nowrap">{formatDate(order.createdAt)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {active && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                      )}
                      <Badge variant={STATUS_COLORS[order.status]} dot>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${order.id}`);
                      }}
                    >
                      View
                    </Button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

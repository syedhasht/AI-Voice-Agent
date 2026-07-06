import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white rounded-2xl shadow-xl border border-border p-6 w-full max-w-sm"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-tertiary transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-accent/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-accent" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary">{title}</h3>
                <p className="text-sm text-text-secondary mt-1">{message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button variant="danger" onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

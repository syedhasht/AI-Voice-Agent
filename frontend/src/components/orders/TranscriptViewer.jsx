import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { classNames } from '../../utils/helpers';

export default function TranscriptViewer({ transcript }) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-text-tertiary">No transcript available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {transcript.map((turn, i) => {
        const isAI = turn.speaker === 'AI';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={classNames(
              'flex gap-3',
              isAI ? '' : 'flex-row-reverse'
            )}
          >
            <div className={classNames(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
              isAI ? 'bg-primary/10 text-primary' : 'bg-emerald/10 text-emerald-dark'
            )}>
              {isAI ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className={classNames(
              'max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm',
              isAI
                ? 'bg-surface-secondary text-text-primary rounded-tl-sm'
                : 'bg-primary text-white rounded-tr-sm'
            )}>
              {turn.text}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
